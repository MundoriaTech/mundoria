"use client";

import { CreditCard, LogOut, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ActionError, FieldError, invalidControlClass } from "@/components/shared/action-error";
import { AvatarUpload } from "@/components/shared/avatar-upload";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFeedback } from "@/components/shared/feedback-provider";
import { SERVICES } from "@/lib/customer/services";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/auth";
import type {
  CleanerArea,
  CleanerAvailability,
  CleanerProfile,
  CleanerService,
} from "@/types/cleaner";

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
  const { success } = useFeedback();
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
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
  const [status, setStatus] = useState<string | null>(null);

  async function save() {
    const phone = profile.phone?.trim() ?? "";
    if (phone.length < 7) {
      setPhoneError("Enter a valid phone number.");
      setStatus(null);
      return;
    }
    setPhoneError(null);
    setStatus("Saving…");
    const supabase = createBrowserClient();

    await Promise.all([
      supabase
        .from("profiles")
        .update({
          avatar_url: profile.avatar_url,
          full_name: profile.full_name,
          phone,
        })
        .eq("id", profile.id),
      supabase
        .from("cleaner_profiles")
        .update({
          bio: cleaner.bio,
          payout_preference: cleaner.payout_preference,
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

    setStatus(null);
    success({
      kind: "saved",
      title: "Profile saved",
      note: "Your availability and services are up to date.",
    });
    router.refresh();
  }

  async function connectStripe() {
    setStripeError(null);
    setStatus("Opening Stripe…");

    try {
      const response = await fetch(
        profile.stripe_account_id
          ? "/api/cleaner/stripe-dashboard"
          : "/api/cleaner/stripe-connect",
        { method: "POST" },
      );
      const result = (await parseJsonResponse(response)) as {
        error?: string;
        url?: string;
      };

      if (result.url) {
        window.location.assign(result.url);
        return;
      }

      setStripeError(result.error ?? "Try again in a moment.");
      setStatus(null);
    } catch (error) {
      setStripeError(
        error instanceof Error ? error.message : "Try again in a moment.",
      );
      setStatus(null);
    }
  }

  async function logout() {
    await createBrowserClient().auth.signOut();
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

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)]">
      <section className="rounded-[1.75rem] border border-[#e6e0f2] bg-white p-5 shadow-[0_12px_28px_rgba(28,19,59,0.05)] sm:p-7">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c79c66]">
          You
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#1c133b]">
          Photo and details
        </h2>
        <div className="mt-5">
          <AvatarUpload
            currentUrl={profile.avatar_url}
            keepFiles={[cleaner.headshot_url]}
            onUpload={(url) => {
              setProfile((current) => ({ ...current, avatar_url: url }));
              success({
                kind: "updated",
                title: "Look updated",
                note: "Your new avatar is live.",
              });
            }}
            userId={profile.id}
          />
        </div>

        <div className="mt-6 space-y-4">
          <Field label="Full name">
            <Input
              className={fieldClass}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  full_name: event.target.value,
                }))
              }
              value={profile.full_name}
            />
          </Field>
          <Field error={phoneError} label="Phone number">
            <Input
              className={cn(fieldClass, phoneError && invalidControlClass)}
              onChange={(event) => {
                setPhoneError(null);
                setProfile((current) => ({
                  ...current,
                  phone: event.target.value,
                }));
              }}
              required
              type="tel"
              value={profile.phone ?? ""}
            />
          </Field>
          <AboutYou
            name={profile.full_name}
            onChange={(bio) =>
              setCleaner((current) => ({
                ...current,
                bio,
              }))
            }
            seed={profile.id}
            url={profile.avatar_url}
            value={cleaner.bio ?? ""}
          />
          <Field label="Years of experience">
            <Input
              className={fieldClass}
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
          </Field>
          <fieldset>
            <legend className="text-sm font-medium text-[#1c133b]">Pay me</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["weekly", "monthly"] as const).map((option) => (
                <button
                  className={cn(
                    "h-11 rounded-2xl border text-sm font-semibold transition",
                    cleaner.payout_preference === option
                      ? "border-[#312c79] bg-[#f7f3ff] text-[#312c79]"
                      : "border-[#e6e0f2] bg-white text-[#5c5670] hover:bg-[#fbf9ff]",
                  )}
                  key={option}
                  onClick={() =>
                    setCleaner((current) => ({
                      ...current,
                      payout_preference: option,
                    }))
                  }
                  type="button"
                >
                  {option === "weekly" ? "Each week" : "Each month"}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      <div className="space-y-5">
        <Panel eyebrow="Work" title="Services you offer">
          <div className="grid gap-2">
            {listedServices.map((service) => {
              const selected = services.includes(service.value);
              return (
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm transition",
                    selected
                      ? "border-[#312c79] bg-[#f7f3ff] text-[#312c79]"
                      : "border-[#e6e0f2] bg-white text-[#1c133b] hover:bg-[#fbf9ff]",
                  )}
                  key={service.value}
                >
                  <input
                    checked={selected}
                    className="h-4 w-4 accent-[#312c79]"
                    onChange={(event) =>
                      setServices((current) =>
                        event.target.checked
                          ? [...current, service.value]
                          : current.filter((item) => item !== service.value),
                      )
                    }
                    type="checkbox"
                  />
                  <span className="font-medium">{service.label}</span>
                </label>
              );
            })}
          </div>
        </Panel>

        <Panel eyebrow="Area" title="Where you work">
          <Field
            hint="Offers stay inside this distance, and never beyond 15 miles."
            label="Working radius, in miles"
          >
            <Input
              className={fieldClass}
              max={15}
              min={1}
              onChange={(event) =>
                setRadiusMiles(Number(event.target.value) || 1)
              }
              type="number"
              value={radiusMiles}
            />
          </Field>
          <div className="mt-4 flex gap-2">
            <Input
              className={fieldClass}
              onChange={(event) => setPrefix(event.target.value.toUpperCase())}
              placeholder="Postcode area, such as SW1"
              value={prefix}
            />
            <Button
              className="h-11 w-11 shrink-0 rounded-2xl bg-[#1c133b] text-white hover:bg-[#312c79]"
              onClick={() => {
                const next = prefix.trim().toUpperCase();
                if (next) {
                  setAreas((current) => Array.from(new Set([...current, next])));
                }
                setPrefix("");
              }}
              size="icon"
            >
              <Plus />
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {areas.filter(Boolean).map((area) => (
              <button
                className="inline-flex items-center rounded-full bg-[#f3efe6] px-3 py-1.5 text-sm font-medium text-[#1c133b]"
                key={area}
                onClick={() =>
                  setAreas((current) => current.filter((item) => item !== area))
                }
                type="button"
              >
                {area}
                <X className="ml-1.5 h-3 w-3" />
              </button>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Diary" title="Days you work">
          <div className="space-y-2">
            {availability.map((day, index) => (
              <label
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-sm",
                  day.is_available ? "bg-[#f7f3ff] text-[#312c79]" : "bg-[#f7f4f8] text-[#5c5670]",
                )}
                key={day.day_of_week}
              >
                <span className="font-medium">
                  <input
                    checked={day.is_available}
                    className="mr-2 h-4 w-4 accent-[#312c79]"
                    onChange={(event) => {
                      const next = [...availability];
                      next[index] = { ...day, is_available: event.target.checked };
                      setAvailability(next);
                    }}
                    type="checkbox"
                  />
                  {DAY_NAMES[day.day_of_week]}
                </span>
                <span className="tabular-nums">
                  {day.start_time.slice(0, 5)}–{day.end_time.slice(0, 5)}
                </span>
              </label>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Checks" title="Documents">
          <StatusRow label="DBS" value={labelStatus(cleaner.dbs_document_status)} />
          <StatusRow label="Photo ID" value={labelStatus(cleaner.id_document_status)} />
        </Panel>

        <Panel eyebrow="Money" title="Payouts">
          <StatusRow label="Stripe" value={stripeLabel} />
          <p className="text-sm leading-6 text-[#5c5670]">
            You can connect after approval. Pay is sent once Stripe Express is complete.
          </p>
          <Button
            className="h-11 w-full rounded-full border-[#e6e0f2] text-[#1c133b]"
            onClick={() => void connectStripe()}
            variant="outline"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {profile.stripe_account_id ? "Open Stripe Express" : "Connect Stripe Express"}
          </Button>
          {stripeError ? (
            <ActionError message={stripeError} title="Couldn’t open Stripe" />
          ) : null}
        </Panel>

        {status ? <p className="text-sm text-[#312c79]">{status}</p> : null}

        <Button
          className="h-12 w-full rounded-full bg-[#1c133b] text-white hover:bg-[#312c79]"
          onClick={() => void save()}
        >
          Save profile
        </Button>
        <Button
          className="h-11 w-full rounded-full text-[#7a3b28] hover:bg-[#fff4ee] hover:text-[#7a3b28]"
          onClick={() => void logout()}
          variant="ghost"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  );
}

const fieldClass =
  "rounded-2xl border-[#e6e0f2] bg-white text-[#1c133b] focus-visible:ring-[#312c79]";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function labelStatus(value: string) {
  if (value === "verified") return "Approved";
  if (value === "pending") return "Being checked";
  if (value === "rejected") return "Needs another look";
  if (value === "missing") return "Not uploaded";
  return value.replaceAll("_", " ");
}

function AboutYou({
  name,
  onChange,
  seed,
  url,
  value,
}: {
  name: string;
  onChange: (value: string) => void;
  seed: string;
  url: string | null;
  value: string;
}) {
  const firstName = name.trim().split(/\s+/)[0] || "You";
  const length = value.trim().length;
  const guide =
    length === 0
      ? "A sentence or two is enough."
      : length < 20
        ? "A little more helps someone know you."
        : "This is what customers read.";

  return (
    <div className="rounded-[1.35rem] border border-[#e6e0f2] bg-[#fbf8ff] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[#1c133b]">About you</p>
        {value ? (
          <button
            className="text-xs font-semibold text-[#312c79]"
            onClick={() => onChange("")}
            type="button"
          >
            Clear
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-xs leading-5 text-[#5c5670]">
        Write it the way you would introduce yourself before a visit.
      </p>
      <div className="mt-3 rounded-2xl bg-white p-3 shadow-[0_8px_20px_rgba(28,19,59,0.04)]">
        <div className="flex items-center gap-3">
          <UserAvatar name={name} seed={seed} url={url} />
          <div>
            <p className="text-sm font-semibold text-[#1c133b]">{firstName}</p>
            <p className="text-[11px] text-[#8b849c]">How customers see this</p>
          </div>
        </div>
        <label className="mt-3 block">
          <span className="sr-only">About you</span>
          <textarea
            className="min-h-28 w-full resize-y bg-transparent text-sm leading-6 text-[#1c133b] outline-none placeholder:text-[#8b849c]"
            maxLength={2000}
            onChange={(event) => onChange(event.target.value)}
            placeholder="I look after homes nearby, and I like leaving a kitchen that feels easy to walk back into."
            value={value}
          />
        </label>
      </div>
      <p className="mt-2 text-[11px] text-[#8b849c]">{guide}</p>
    </div>
  );
}

function Field({
  children,
  error,
  hint,
  label,
}: {
  children: React.ReactNode;
  error?: string | null;
  hint?: string;
  label: string;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium text-[#1c133b]">
      <span>{label}</span>
      {children}
      {hint ? <span className="block text-xs font-normal leading-5 text-[#5c5670]">{hint}</span> : null}
      {error ? <FieldError message={error} /> : null}
    </label>
  );
}

function Panel({
  children,
  eyebrow,
  title,
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="space-y-3 rounded-[1.75rem] border border-[#e6e0f2] bg-white p-5 shadow-[0_12px_28px_rgba(28,19,59,0.05)] sm:p-6">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c79c66]">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#1c133b]">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#f7f4f8] px-3 py-2.5">
      <span className="text-sm text-[#5c5670]">{label}</span>
      <span className="text-sm font-semibold text-[#1c133b]">{value}</span>
    </div>
  );
}

async function parseJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return {
    error:
      text ||
      `Request failed with status ${response.status}. Please try again.`,
  };
}
