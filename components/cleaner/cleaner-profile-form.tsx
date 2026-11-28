"use client";

import { CreditCard, LogOut, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ChangeEmailForm } from "@/components/auth/change-email-form";
import { ReplaceDocument } from "@/components/cleaner/replace-document";
import {
  StripeEmbeddedPayouts,
  useStripeEmbeddedPayouts,
} from "@/components/cleaner/stripe-embedded-payouts";
import {
  pillOutline,
  pillPrimary,
  pillPrimaryStyle,
  SectionBanner,
} from "@/components/customer/dashboard/section-banner";
import { ActionError, FieldError, invalidControlClass } from "@/components/shared/action-error";
import { AvatarUpload } from "@/components/shared/avatar-upload";
import { useFeedback } from "@/components/shared/feedback-provider";
import { RoundCheckbox } from "@/components/ui/round-checkbox";
import { clearPersonalBrowserData } from "@/lib/auth/clear-personal-data";
import { normalizePhone } from "@/lib/auth/phone-verify";
import { isValidUkPhone, storedPhone } from "@/lib/auth/uk-phone";
import {
  CLEANER_DOCUMENT_KINDS,
  CLEANER_DOCUMENT_LABELS,
  cleanerFacingDocStatus,
  documentReviewNoteFor,
  documentStatusColumn,
} from "@/lib/cleaner/document-reviews";
import { SERVICES } from "@/lib/customer/services";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/auth";
import type {
  CleanerArea,
  CleanerAvailability,
  CleanerProfile,
  CleanerService,
  DocumentReviewStatus,
} from "@/types/cleaner";

const tileLabel =
  "m-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#524096]/70";

const inputClass =
  "h-12 w-full rounded-[12px] border-[1.5px] border-[#E1E1EA] bg-white px-3.5 text-[16px] text-[#1E1848] outline-none transition focus:border-[#524096] disabled:bg-[#ECEBF1] disabled:text-[#6B6B70]";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function FieldTile({
  children,
  hint,
  label,
}: {
  children: React.ReactNode;
  hint?: string;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-[14px] bg-[#F3F4F6] p-4">
      <span className={tileLabel}>{label}</span>
      {children}
      {hint ? (
        <span className="text-[12.5px] leading-5 text-[#6B6B70]">{hint}</span>
      ) : null}
    </div>
  );
}

function memberSince(createdAt: string | null | undefined) {
  if (!createdAt) return null;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function CleanerProfileForm({
  areas: initialAreas,
  availability: initialAvailability,
  cleaner: initialCleaner,
  profile: initialProfile,
  services: initialServices,
}: {
  areas: CleanerArea[];
  availability: CleanerAvailability[];
  cleaner: CleanerProfile;
  profile: Profile;
  services: CleanerService[];
}) {
  const router = useRouter();
  const { confirm, success } = useFeedback();
  const payouts = useStripeEmbeddedPayouts();
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [profile, setProfile] = useState(initialProfile);
  const [cleaner, setCleaner] = useState(initialCleaner);
  const [services, setServices] = useState(
    initialServices.map((service) => service.service_type),
  );
  const [areas, setAreas] = useState(
    initialAreas.map((area) => area.postcode_prefix ?? ""),
  );
  const [availability, setAvailability] = useState(initialAvailability);
  const [radiusMiles, setRadiusMiles] = useState(() =>
    Math.min(
      15,
      Math.max(1, Math.round(initialCleaner.working_radius_km / 1.609344)),
    ),
  );
  const [prefix, setPrefix] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function save() {
    const typedPhone = profile.phone?.trim() ?? "";
    if (!isValidUkPhone(typedPhone)) {
      setPhoneError("Enter a full UK phone number, like 07700 900123.");
      setStatus(null);
      return;
    }
    const phone = storedPhone(typedPhone);
    setPhoneError(null);
    setSaving(true);
    setStatus(null);
    const supabase = createBrowserClient();

    const phoneChanged =
      normalizePhone(phone) !== normalizePhone(initialProfile.phone ?? "");
    await Promise.all([
      supabase
        .from("profiles")
        .update({
          avatar_url: profile.avatar_url,
          phone,
          ...(phoneChanged ? { phone_verified_at: null } : {}),
        })
        .eq("id", profile.id),
      supabase
        .from("cleaner_profiles")
        .update({
          bio: cleaner.bio,
          working_radius_km: Math.round(
            Math.min(15, Math.max(1, radiusMiles)) * 1.609344,
          ),
          years_experience: cleaner.years_experience,
        })
        .eq("id", profile.id),
      supabase.from("cleaner_services").delete().eq("cleaner_id", profile.id),
      supabase
        .from("cleaner_working_areas")
        .delete()
        .eq("cleaner_id", profile.id),
      supabase
        .from("cleaner_availability")
        .delete()
        .eq("cleaner_id", profile.id),
    ]);

    await Promise.all([
      supabase.from("cleaner_services").insert(
        services.map((service_type) => ({
          cleaner_id: profile.id,
          service_type,
        })),
      ),
      supabase.from("cleaner_working_areas").insert(
        areas
          .map((area) => area.trim().toUpperCase())
          .filter(Boolean)
          .map((postcode_prefix) => ({
            cleaner_id: profile.id,
            postcode_prefix,
          })),
      ),
      supabase.from("cleaner_availability").insert(
        availability.map((day) => ({
          cleaner_id: profile.id,
          day_of_week: day.day_of_week,
          end_time: day.end_time,
          is_available: day.is_available,
          start_time: day.start_time,
        })),
      ),
    ]);

    if (phoneChanged) {
      setProfile((current) => ({ ...current, phone_verified_at: null }));
    }
    // Zoho: name/phone on the CRM lead, bio/areas/hours on the Recruit candidate.
    void fetch("/api/profile/crm-sync", { method: "POST" }).catch(
      () => undefined,
    );
    setSaving(false);
    success({
      kind: "saved",
      title: "Profile saved",
      note: "Your availability and services are up to date.",
    });
    router.refresh();
  }

  async function connectStripe() {
    setStatus(null);
    await payouts.start(
      cleaner.stripe_onboarding_complete ? "management" : "onboarding",
    );
  }

  async function logout() {
    const confirmed = await confirm({
      action: "Log out",
      description: "You will need to sign in again to see your account.",
      title: "Log out of Mundoria?",
      variant: "destructive",
    });
    if (!confirmed) return;
    await createBrowserClient().auth.signOut();
    clearPersonalBrowserData();
    router.replace("/login");
  }

  const listedServices = SERVICES.filter(
    (service) => !service.hidden || services.includes(service.value),
  );
  const stripeLabel = cleaner.stripe_onboarding_complete
    ? "Ready for payouts"
    : profile.stripe_account_id
      ? "Setup still to finish"
      : "Not connected";
  const since = memberSince(profile.created_at);
  const canManagePayouts =
    cleaner.status === "certified" || cleaner.status === "active";

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <section className="rounded-[22px] bg-white p-4 sm:p-5">
        <div className="grid gap-4 rounded-[18px] bg-[#F3F4F6] p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-8">
          <div className="min-w-0 lg:order-2">
            <p className={tileLabel}>Your account</p>
            <p className="m-0 mt-1.5 break-words text-[24px] font-semibold leading-tight tracking-[-0.02em] text-[#1E1848] sm:text-[28px]">
              {profile.full_name}
            </p>
            <p className="m-0 mt-1 break-all text-[15px] text-[#5F5F66]">
              {profile.email}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {since ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[13px] font-medium text-[#5F5F66]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8B7FC0]" />
                  Cleaner since {since}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[13px] font-medium capitalize text-[#5F5F66]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#524096]" />
                {cleaner.tier} · {cleaner.status.replaceAll("_", " ")}
              </span>
            </div>
          </div>
          <div className="min-w-0 lg:order-1">
            <AvatarUpload
              currentUrl={profile.avatar_url}
              keepFiles={[cleaner.headshot_url]}
              onUpload={(url) => {
                setProfile((current) => ({ ...current, avatar_url: url }));
                success({
                  kind: "updated",
                  title: "Photo updated",
                  note: "Your new avatar is live.",
                });
              }}
              userId={profile.id}
            />
          </div>
        </div>
      </section>

      <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4 sm:gap-5">
          <section className="flex flex-col gap-4 rounded-[22px] bg-white p-4 sm:p-5">
            <SectionBanner title="Personal details" />
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldTile
                hint="Contact support to change your name."
                label="Full name"
              >
                <input
                  aria-label="Full name"
                  className={inputClass}
                  disabled
                  readOnly
                  value={profile.full_name}
                />
              </FieldTile>
              <FieldTile label="Years of experience">
                <input
                  aria-label="Years of experience"
                  className={inputClass}
                  min={0}
                  onChange={(event) =>
                    setCleaner((current) => ({
                      ...current,
                      years_experience: Number(event.target.value),
                    }))
                  }
                  type="number"
                  value={cleaner.years_experience ?? 0}
                />
              </FieldTile>
              <div className="sm:col-span-2">
                <FieldTile label="Email address">
                  <ChangeEmailForm currentEmail={profile.email} embedded />
                </FieldTile>
              </div>
              <div className="sm:col-span-2">
                <FieldTile
                  hint="For texts about jobs and visits."
                  label="Phone number"
                >
                  <input
                    aria-label="Phone number"
                    autoComplete="tel"
                    className={cn(inputClass, phoneError && invalidControlClass)}
                    inputMode="tel"
                    onChange={(event) => {
                      setPhoneError(null);
                      setProfile((current) => ({
                        ...current,
                        phone: event.target.value,
                      }));
                    }}
                    placeholder="07700 900123"
                    required
                    type="tel"
                    value={profile.phone ?? ""}
                  />
                  {phoneError ? <FieldError message={phoneError} /> : null}
                </FieldTile>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-[22px] bg-white p-4 sm:p-5">
            <SectionBanner title="About you" />
            <FieldTile
              hint={
                (cleaner.bio ?? "").trim().length === 0
                  ? "A sentence or two is enough."
                  : (cleaner.bio ?? "").trim().length < 40
                    ? "A little more helps someone know you."
                    : "This is what customers read."
              }
              label="Your intro"
            >
              <textarea
                aria-label="About you"
                className="min-h-[7.5rem] w-full resize-y rounded-[12px] border-[1.5px] border-[#E1E1EA] bg-white px-3.5 py-3 text-[15px] leading-6 text-[#1E1848] outline-none placeholder:text-[#8B8798] focus:border-[#524096]"
                maxLength={2000}
                onChange={(event) =>
                  setCleaner((current) => ({
                    ...current,
                    bio: event.target.value,
                  }))
                }
                placeholder="I look after homes nearby, and I like leaving a kitchen that feels easy to walk back into."
                value={cleaner.bio ?? ""}
              />
              <p className="m-0 text-right tabular-nums text-[12px] text-[#8A84A0]">
                {(cleaner.bio ?? "").length}/2000
              </p>
            </FieldTile>
          </section>

          <section className="flex flex-col gap-4 rounded-[22px] bg-white p-4 sm:p-5">
            <SectionBanner title="Services you offer" />
            <div className="grid gap-3 sm:grid-cols-2">
              {listedServices.map((service) => {
                const selected = services.includes(service.value);
                return (
                  <label
                    className={cn(
                      "flex min-h-[64px] cursor-pointer items-center gap-3 rounded-[14px] bg-[#F3F4F6] px-4 py-3 transition hover:bg-[#ECE8F6]",
                      selected && "ring-2 ring-[#524096]/35",
                    )}
                    key={service.value}
                  >
                    <RoundCheckbox
                      checked={selected}
                      onChange={(event) =>
                        setServices((current) =>
                          event.target.checked
                            ? [...current, service.value]
                            : current.filter((item) => item !== service.value),
                        )
                      }
                    />
                    <span className="text-[15px] font-semibold text-[#1E1848]">
                      {service.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-4 sm:gap-5">
          <section className="flex flex-col gap-4 rounded-[22px] bg-white p-4 sm:p-5">
            <SectionBanner title="Where you work" />
            <FieldTile
              hint="Offers stay inside this distance, and never beyond 15 miles."
              label="Working radius, in miles"
            >
              <input
                aria-label="Working radius in miles"
                className={inputClass}
                max={15}
                min={1}
                onChange={(event) =>
                  setRadiusMiles(Number(event.target.value) || 1)
                }
                type="number"
                value={radiusMiles}
              />
            </FieldTile>
            <FieldTile
              hint="Add the postcode areas you cover."
              label="Postcode areas"
            >
              <div className="flex gap-2">
                <input
                  aria-label="Postcode area"
                  className={cn(inputClass, "min-w-0 flex-1")}
                  onChange={(event) =>
                    setPrefix(event.target.value.toUpperCase())
                  }
                  placeholder="e.g. SW1"
                  value={prefix}
                />
                <button
                  aria-label="Add postcode area"
                  className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#524096] text-white transition hover:bg-[#43357f]"
                  onClick={() => {
                    const next = prefix.trim().toUpperCase();
                    if (next) {
                      setAreas((current) =>
                        Array.from(new Set([...current, next])),
                      );
                    }
                    setPrefix("");
                  }}
                  type="button"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              {areas.filter(Boolean).length ? (
                <div className="flex flex-wrap gap-2">
                  {areas.filter(Boolean).map((area) => (
                    <button
                      className="inline-flex items-center rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#524096] ring-1 ring-[#D4CCEA]"
                      key={area}
                      onClick={() =>
                        setAreas((current) =>
                          current.filter((item) => item !== area),
                        )
                      }
                      type="button"
                    >
                      {area}
                      <X className="ml-1.5 h-3.5 w-3.5" />
                    </button>
                  ))}
                </div>
              ) : null}
            </FieldTile>
          </section>

          <section className="flex flex-col gap-4 rounded-[22px] bg-white p-4 sm:p-5">
            <SectionBanner title="Days you work" />
            <div className="flex flex-col gap-3">
              {availability.map((day, index) => (
                <label
                  className="flex min-h-[64px] cursor-pointer items-center justify-between gap-4 rounded-[14px] bg-[#F3F4F6] px-4 py-3"
                  key={day.day_of_week}
                >
                  <span className="inline-flex min-w-0 items-center gap-3">
                    <RoundCheckbox
                      checked={day.is_available}
                      onChange={(event) => {
                        const next = [...availability];
                        next[index] = {
                          ...day,
                          is_available: event.target.checked,
                        };
                        setAvailability(next);
                      }}
                    />
                    <span className="text-[15px] font-semibold text-[#1E1848]">
                      {DAY_NAMES[day.day_of_week]}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-[13px] tabular-nums",
                      day.is_available ? "text-[#5F5F66]" : "text-[#A9A3BD]",
                    )}
                  >
                    {day.start_time.slice(0, 5)}–{day.end_time.slice(0, 5)}
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-[22px] bg-white p-4 sm:p-5">
            <SectionBanner title="Documents" />
            <p className="m-0 text-[13px] leading-[1.45] text-[#6B6B70]">
              Mundoria reviews each document separately. If one needs another
              look, you&apos;ll see why here and can upload a new one.
            </p>
            <div className="grid gap-3">
              {CLEANER_DOCUMENT_KINDS.map((kind) => {
                const docStatus = cleaner[
                  documentStatusColumn(kind)
                ] as DocumentReviewStatus;
                const review = documentReviewNoteFor(
                  cleaner.verification_flags,
                  kind,
                );
                return (
                  <div
                    className="rounded-[14px] bg-[#F3F4F6] px-4 py-3"
                    key={kind}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="m-0 text-[15px] font-semibold text-[#1E1848]">
                        {CLEANER_DOCUMENT_LABELS[kind]}
                      </p>
                      <p
                        className={cn(
                          "m-0 shrink-0 text-[13px] font-semibold",
                          docStatus === "verified"
                            ? "text-emerald-700"
                            : docStatus === "rejected" ||
                                docStatus === "expired"
                              ? "text-amber-800"
                              : "text-[#6B6B70]",
                        )}
                      >
                        {cleanerFacingDocStatus(docStatus)}
                      </p>
                    </div>
                    {review?.note &&
                    (docStatus === "rejected" ||
                      review.decision === "rejected") ? (
                      <p className="m-0 mt-2 text-[13px] leading-5 text-[#6B6B70]">
                        {review.note}
                      </p>
                    ) : null}
                    {kind !== "headshot" &&
                    (docStatus === "rejected" ||
                      docStatus === "missing" ||
                      docStatus === "expired" ||
                      docStatus === "pending" ||
                      !docStatus) ? (
                      <ReplaceDocument
                        initial={
                          kind === "right_to_work"
                            ? {
                                date_of_birth: cleaner.date_of_birth,
                                right_to_work_expires_on:
                                  cleaner.right_to_work_expires_on,
                                right_to_work_route: cleaner.right_to_work_route,
                                right_to_work_share_code:
                                  cleaner.right_to_work_share_code,
                                right_to_work_visa_type:
                                  cleaner.right_to_work_visa_type,
                              }
                            : undefined
                        }
                        kind={kind}
                        userId={profile.id}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-[22px] bg-white p-4 sm:p-5">
            <SectionBanner title="Payouts" />
            <div className="flex min-h-[64px] items-center justify-between gap-3 rounded-[14px] bg-[#F3F4F6] px-4 py-3">
              <span className="text-[15px] text-[#6B6B70]">Stripe</span>
              <span className="text-[15px] font-semibold text-[#1E1848]">
                {stripeLabel}
              </span>
            </div>
            <p className="m-0 text-[13px] leading-[1.45] text-[#6B6B70]">
              {canManagePayouts
                ? "Pay is sent once payout setup is complete. Bank details stay with Stripe."
                : "Set up payouts after Mundoria approves your application. You’ll see a payout setup card on your dashboard."}
            </p>
            {canManagePayouts ? (
              <button
                className={pillOutline}
                disabled={payouts.busy}
                onClick={() => void connectStripe()}
                type="button"
              >
                <CreditCard className="h-4 w-4" />
                {payouts.busy
                  ? "Loading…"
                  : cleaner.stripe_onboarding_complete
                    ? "Manage payout details"
                    : profile.stripe_account_id
                      ? "Finish payout setup"
                      : "Set up payouts"}
              </button>
            ) : null}
            {payouts.error ? (
              <ActionError
                message={payouts.error}
                title="Couldn’t open payout setup"
              />
            ) : null}
          </section>
        </div>
      </div>

      <section className="flex flex-col gap-4 rounded-[22px] bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0">
          <p className="m-0 text-[15px] font-semibold text-[#1E1848]">
            Save your changes
          </p>
          <p className="m-0 mt-0.5 text-[13px] text-[#6B6B70]">
            Updates services, areas, availability and your profile details.
          </p>
          {status ? (
            <p className="m-0 mt-2 rounded-[12px] bg-[#FEE9E9] px-3 py-2 text-sm text-[#C0272D]">
              {status}
            </p>
          ) : null}
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <button
            className={`${pillPrimary} w-full sm:w-auto sm:min-w-[10.5rem]`}
            disabled={saving}
            onClick={() => void save()}
            style={pillPrimaryStyle}
            type="button"
          >
            {saving ? "Saving…" : "Save profile"}
          </button>
          <button
            className="flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-[#F1C9C6] px-5 text-[15px] font-semibold text-[#C0272D] transition hover:bg-[#FEF0EF]"
            onClick={() => void logout()}
            type="button"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Log out
          </button>
        </div>
      </section>

      <StripeEmbeddedPayouts
        bankFocused={payouts.bankFocused}
        mode={payouts.mode}
        onClose={payouts.close}
        open={payouts.open}
        title={
          cleaner.stripe_onboarding_complete
            ? "Manage payout details"
            : "Set up your payouts"
        }
      />
    </div>
  );
}
