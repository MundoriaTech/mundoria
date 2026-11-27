"use client";

import { Bell, Copy, CreditCard, HelpCircle, LogOut, MapPin, Receipt, Share2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ChangeEmailForm } from "@/components/auth/change-email-form";
import {
  pillOutline,
  pillPrimary,
  pillPrimaryStyle,
  SectionBanner,
} from "@/components/customer/dashboard/section-banner";
import { AvatarUpload } from "@/components/shared/avatar-upload";
import { useFeedback } from "@/components/shared/feedback-provider";
import { trackCrmEvent } from "@/lib/analytics/crm-events";
import { clearPersonalBrowserData } from "@/lib/auth/clear-personal-data";
import { isValidUkPhone, storedPhone } from "@/lib/auth/uk-phone";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/auth";

const tileLabel = "m-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#524096]/70";

function Toggle({
  checked,
  hint,
  label,
  onChange,
}: {
  checked: boolean;
  hint: string;
  label: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex min-h-[64px] items-center justify-between gap-4 rounded-[14px] bg-[#F3F4F6] px-4 py-3">
      <div className="min-w-0">
        <p className="m-0 text-[15px] font-semibold text-[#1E1848]">{label}</p>
        <p className="m-0 mt-0.5 text-[13px] text-[#6B6B70]">{hint}</p>
      </div>
      <button
        aria-checked={checked}
        aria-label={label}
        className="relative h-[28px] w-[48px] shrink-0 rounded-full transition"
        onClick={() => onChange(!checked)}
        role="switch"
        style={{ background: checked ? "#524096" : "#C9C6D3" }}
        type="button"
      >
        <span
          className="absolute top-[3px] block h-[22px] w-[22px] rounded-full bg-white shadow transition-all"
          style={{ left: checked ? "23px" : "3px" }}
        />
      </button>
    </div>
  );
}

function FieldTile({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-[14px] bg-[#F3F4F6] p-4">
      <span className={tileLabel}>{label}</span>
      {children}
    </div>
  );
}

const inputClass =
  "h-12 w-full rounded-[12px] border-[1.5px] border-[#E1E1EA] bg-white px-3.5 text-[16px] text-[#1E1848] outline-none transition focus:border-[#524096] disabled:bg-[#ECEBF1] disabled:text-[#6B6B70]";

function memberSince(createdAt: string | null | undefined) {
  if (!createdAt) return null;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function ProfileForm({ initialProfile }: { initialProfile: Profile }) {
  const router = useRouter();
  const { confirm, success } = useFeedback();
  const [profile, setProfile] = useState(initialProfile);
  const [status, setStatus] = useState<string | null>(null);
  const [portalStatus, setPortalStatus] = useState<string | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    const typedPhone = profile.phone?.trim() ?? "";
    if (typedPhone && !isValidUkPhone(typedPhone)) {
      setStatus("Enter a full UK phone number, like 07700 900123.");
      return;
    }
    setSaving(true);
    setStatus(null);
    const { error } = await createBrowserClient()
      .from("profiles")
      .update({
        notification_preferences: profile.notification_preferences,
        phone: typedPhone ? storedPhone(typedPhone) : null,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      setStatus(error.message);
      return;
    }
    // Keep the Zoho contact's phone in step; never blocks the save.
    void fetch("/api/profile/crm-sync", { method: "POST" }).catch(() => undefined);
    trackCrmEvent("account_updated", {
      action: "save_profile",
      customer_id: profile.id,
    });
    success({ kind: "saved", title: "Profile saved", note: "Your details are up to date." });
    router.refresh();
  }

  async function openPortal() {
    setPortalBusy(true);
    setPortalStatus("Opening secure payment settings…");
    try {
      const response = await fetch("/api/stripe/customer-portal", { method: "POST" });
      const result = (await response.json()) as { error?: string; url?: string };
      if (!response.ok || !result.url) {
        setPortalStatus(result.error ?? "Unable to open payment settings.");
        setPortalBusy(false);
        return;
      }
      window.location.assign(result.url);
    } catch {
      setPortalStatus("Unable to open payment settings. Please try again.");
      setPortalBusy(false);
    }
  }

  async function logout() {
    const confirmed = await confirm({
      action: "Log out",
      description: "You will need to sign in again to see your account.",
      title: "Log out of Mundoria?",
      variant: "destructive",
    });
    if (!confirmed) return;
    trackCrmEvent("logout", {
      action: "sign_out",
      customer_id: profile.id,
    });
    await createBrowserClient().auth.signOut();
    clearPersonalBrowserData();
    router.replace("/login");
    router.refresh();
  }

  function copyCode() {
    void navigator.clipboard.writeText(profile.referral_code);
    success({ kind: "done", title: "Code copied", note: "Share it with a friend and you both win." });
  }

  function copyInvite() {
    const link = `${window.location.origin}/signup?ref=${profile.referral_code}`;
    void navigator.clipboard.writeText(link);
    success({ kind: "done", title: "Invite link copied", note: "Send it along, they'll thank you later." });
  }

  const since = memberSince((profile as { created_at?: string }).created_at);
  const accountLinks = [
    { hint: "Homes and places you book for", href: "/addresses", Icon: MapPin, label: "Addresses" },
    { hint: "Invoices and payments due", href: "/payments", Icon: Receipt, label: "Payments & receipts" },
    { hint: "Answers and support", href: "/help", Icon: HelpCircle, label: "Help centre" },
  ];

  return (
    <form className="flex flex-col gap-4 sm:gap-5" onSubmit={saveProfile}>
      {/* Profile banner, in the dashboard's location-card style */}
      <section
        className="relative overflow-hidden rounded-[22px] p-5 sm:p-6"
        style={{ background: "#1E1848" }}
      >
        <svg aria-hidden className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern height="22" id="profile-dots" patternUnits="userSpaceOnUse" width="22">
              <circle cx="1.5" cy="1.5" fill="rgba(255,255,255,0.07)" r="1.5" />
            </pattern>
          </defs>
          <rect fill="url(#profile-dots)" height="100%" width="100%" />
        </svg>
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{ width: "260px", height: "260px", left: "-60px", top: "-90px", background: "radial-gradient(circle,rgba(130,113,177,0.4) 0%,transparent 70%)" }}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          <AvatarUpload
            currentUrl={profile.avatar_url}
            onUpload={(url) => {
              setProfile((c) => ({ ...c, avatar_url: url }));
              success({ kind: "updated", title: "Photo updated", note: "Looking sharp." });
            }}
            userId={profile.id}
          />
          <div className="min-w-0">
            <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#C69C66]">Your account</p>
            <p className="m-0 mt-1 break-words text-[22px] font-bold leading-tight tracking-[-0.01em] text-white sm:text-[26px]">
              {profile.full_name}
            </p>
            <p className="m-0 mt-1 break-all text-[15px] text-white/75">{profile.email}</p>
            {since ? (
              <span
                className="mt-3 inline-flex items-center gap-2 rounded-full text-[13px] font-semibold text-white/85"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", padding: "5px 12px 5px 8px" }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#8B7FC0]" />
                Customer since {since}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid items-start gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4 sm:gap-5">
          {/* Personal details */}
          <section className="flex flex-col gap-4 rounded-[22px] bg-white p-4 sm:p-5">
            <SectionBanner title="Personal details" />
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldTile label="Full name">
                <input aria-label="Full name" className={inputClass} disabled value={profile.full_name} />
                <span className="text-[12.5px] text-[#6B6B70]">Contact support to change your name.</span>
              </FieldTile>
              <FieldTile label="Phone number">
                <input
                  aria-label="Phone number"
                  autoComplete="tel"
                  className={inputClass}
                  inputMode="tel"
                  onChange={(e) => setProfile((c) => ({ ...c, phone: e.target.value }))}
                  placeholder="07700 900123"
                  type="tel"
                  value={profile.phone ?? ""}
                />
                <span className="text-[12.5px] text-[#6B6B70]">For texts about your visits.</span>
              </FieldTile>
              <div className="sm:col-span-2">
                <FieldTile label="Email address">
                  <ChangeEmailForm currentEmail={profile.email} />
                </FieldTile>
              </div>
            </div>
            {status ? (
              <p className="m-0 rounded-[12px] bg-[#FEE9E9] px-4 py-3 text-sm text-[#C0272D]">{status}</p>
            ) : null}
            <div className="flex">
              <button className={`${pillPrimary} w-full sm:w-auto`} disabled={saving} style={pillPrimaryStyle} type="submit">
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </section>

          {/* Notifications */}
          <section className="flex flex-col gap-4 rounded-[22px] bg-white p-4 sm:p-5">
            <SectionBanner title="Notifications" />
            <div className="flex flex-col gap-3">
              {(["email", "sms", "push"] as const).map((pref) => (
                <Toggle
                  checked={profile.notification_preferences[pref]}
                  hint={
                    {
                      email: "Booking updates, invoices and receipts",
                      push: "Live updates on this device",
                      sms: "Texts when your cleaner is on the way",
                    }[pref]
                  }
                  key={pref}
                  label={{ email: "Email", push: "Push notifications", sms: "Text messages" }[pref]}
                  onChange={(v) =>
                    setProfile((c) => ({
                      ...c,
                      notification_preferences: { ...c.notification_preferences, [pref]: v },
                    }))
                  }
                />
              ))}
              <p className="m-0 flex items-center gap-2 text-[13px] text-[#6B6B70]">
                <Bell aria-hidden className="h-4 w-4 shrink-0" />
                Changes here are saved with Save changes above.
              </p>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-4 sm:gap-5">
          {/* Refer a friend, in the dashboard's copper service-card style */}
          <section className="flex flex-col gap-4 rounded-[22px] bg-white p-4 sm:p-5">
            <SectionBanner title="Refer a friend" />
            <div
              className="relative overflow-hidden rounded-[14px] p-5 text-white"
              style={{ background: "linear-gradient(145deg,#B85C38 0%,#D47848 100%)" }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(ellipse at 15% 15%,rgba(255,255,255,0.18) 0%,transparent 55%)" }}
              />
              <p className="relative m-0 text-[15px] font-semibold">You both get £10</p>
              <div className="relative mt-3 flex items-center justify-between gap-3 rounded-[12px] bg-black/20 px-4 py-3">
                <span className="truncate font-mono text-[22px] font-bold tracking-[0.12em]">{profile.referral_code}</span>
                <button
                  className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13.5px] font-semibold text-[#B85C38] transition hover:bg-[#FFF1E8]"
                  onClick={copyCode}
                  type="button"
                >
                  <Copy aria-hidden className="h-3.5 w-3.5" />
                  Copy
                </button>
              </div>
              <p className="relative m-0 mt-3 text-[13px] leading-[1.45] text-white/85">
                Friends get £10 off their first booking. You get a £10 voucher after their first completed clean, for up to 10 active referrals.
              </p>
            </div>
            <button className={pillOutline} onClick={copyInvite} type="button">
              <Share2 aria-hidden className="h-4 w-4" />
              Share invite link
            </button>
          </section>

          {/* Account */}
          <section className="flex flex-col gap-4 rounded-[22px] bg-white p-4 sm:p-5">
            <SectionBanner title="Account" />
            <div className="grid gap-3">
              {accountLinks.map(({ hint, href, Icon, label }) => (
                <Link
                  className="flex min-h-[64px] items-center gap-3 rounded-[14px] bg-[#F3F4F6] px-4 py-3 no-underline transition hover:bg-[#ECE8F6]"
                  href={href}
                  key={href}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white">
                    <Icon aria-hidden className="h-[18px] w-[18px] text-[#524096]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-[#1E1848]">{label}</span>
                    <span className="block text-[13px] text-[#6B6B70]">{hint}</span>
                  </span>
                  <svg aria-hidden fill="none" height={16} stroke="#A9A3BD" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" width={16}><path d="M9 18l6-6-6-6" /></svg>
                </Link>
              ))}
              <button
                className="flex min-h-[64px] items-center gap-3 rounded-[14px] bg-[#F3F4F6] px-4 py-3 text-left transition hover:bg-[#ECE8F6] disabled:opacity-70"
                disabled={portalBusy}
                onClick={() => void openPortal()}
                type="button"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white">
                  <CreditCard aria-hidden className="h-[18px] w-[18px] text-[#524096]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-[#1E1848]">{portalBusy ? "Opening…" : "Payment methods"}</span>
                  <span className="block text-[13px] text-[#6B6B70]">Cards saved securely with Stripe</span>
                </span>
              </button>
              {portalStatus ? (
                <p className="m-0 rounded-[12px] bg-[#F3F4F6] px-4 py-2 text-sm text-[#5F5F66]">{portalStatus}</p>
              ) : null}
              <button
                className="mt-1 flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-[#F1C9C6] text-[15px] font-semibold text-[#C0272D] transition hover:bg-[#FEF0EF]"
                onClick={() => void logout()}
                type="button"
              >
                <LogOut aria-hidden className="h-[18px] w-[18px]" />
                Log out
              </button>
            </div>
          </section>
        </div>
      </div>
    </form>
  );
}
