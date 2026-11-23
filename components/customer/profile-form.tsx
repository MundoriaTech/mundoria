"use client";

import { Copy, CreditCard, LogOut, MapPin, Share2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ChangeEmailForm } from "@/components/auth/change-email-form";
import { AvatarUpload } from "@/components/shared/avatar-upload";
import { useFeedback } from "@/components/shared/feedback-provider";
import { trackCrmEvent } from "@/lib/analytics/crm-events";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/auth";

function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between" style={{ minHeight: "44px" }}>
      <span style={{ fontSize: "15px", color: "#1E1848", fontWeight: 500 }}>{label}</span>
      <button
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        role="switch"
        style={{
          position: "relative",
          width: "44px",
          height: "26px",
          borderRadius: "13px",
          background: checked ? "#524096" : "#D1D5DB",
          border: "none",
          cursor: "pointer",
          transition: "background 0.2s",
          padding: 0,
          flexShrink: 0,
        }}
        type="button"
      >
        <span
          style={{
            position: "absolute",
            top: "3px",
            left: checked ? "21px" : "3px",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            background: "#FFFFFF",
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            transition: "left 0.2s",
            display: "block",
          }}
        />
      </button>
    </label>
  );
}

function SectionCard({ children, subtitle, title }: { children: React.ReactNode; subtitle?: string; title: string }) {
  return (
    <div className="rounded-[18px] bg-white p-6" style={{ border: "1.5px solid #EDEAF5" }}>
      <div className="mb-5">
        <h2 style={{ fontSize: "17.4px", fontWeight: 700, color: "#1E1848", margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: "13.5px", color: "#6B6B70", marginTop: "3px", marginBottom: 0 }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div>
      <label style={{ fontSize: "12.5px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#8B8798", display: "block", marginBottom: "6px" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({
  disabled,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  disabled?: boolean;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
  return (
    <input
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        height: "46px",
        borderRadius: "10px",
        border: "1.5px solid #E1E1EA",
        background: disabled ? "#F7F7FA" : "#FFFFFF",
        padding: "0 14px",
        fontSize: "15px",
        color: disabled ? "#8B8798" : "#1E1848",
        outline: "none",
        boxSizing: "border-box",
        fontFamily: "inherit",
      }}
      type={type}
      value={value}
    />
  );
}

export function ProfileForm({ initialProfile }: { initialProfile: Profile }) {
  const router = useRouter();
  const { success } = useFeedback();
  const [profile, setProfile] = useState(initialProfile);
  const [status, setStatus] = useState<string | null>(null);
  const [portalStatus, setPortalStatus] = useState<string | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    const { error } = await createBrowserClient()
      .from("profiles")
      .update({
        notification_preferences: profile.notification_preferences,
        phone: profile.phone?.trim() || null,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) { setStatus(error.message); return; }
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
    trackCrmEvent("logout", {
      action: "sign_out",
      customer_id: profile.id,
    });
    await createBrowserClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <form onSubmit={saveProfile}>
      <div className="flex flex-col gap-5">

        {/* Profile header */}
        <div
          className="relative overflow-hidden rounded-[18px] p-6"
          style={{ background: "linear-gradient(135deg,#7F71B1 0%,#524096 100%)" }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "repeating-linear-gradient(115deg,rgba(255,255,255,0.05) 0 70px,rgba(255,255,255,0) 70px 140px)" }}
          />
          <div className="relative flex items-center gap-5">
            <AvatarUpload
              currentUrl={profile.avatar_url}
              onUpload={(url) => {
                setProfile((c) => ({ ...c, avatar_url: url }));
                success({ kind: "updated", title: "Photo updated", note: "Looking sharp." });
              }}
              userId={profile.id}
            />
            <div>
              <p style={{ fontSize: "22.8px", fontWeight: 700, color: "#FFFFFF", margin: 0, letterSpacing: "-0.01em" }}>{profile.full_name}</p>
              <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.75)", margin: "3px 0 0" }}>{profile.email}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_380px]">

          {/* Left column */}
          <div className="flex flex-col gap-5">

            <SectionCard subtitle="Update your contact information" title="Personal details">
              <div className="flex flex-col gap-4">
                <Field label="Full name">
                  <TextInput disabled value={profile.full_name} />
                </Field>
                <Field label="Email address">
                  <ChangeEmailForm currentEmail={profile.email} />
                </Field>
                <Field label="Phone number">
                  <TextInput
                    onChange={(v) => setProfile((c) => ({ ...c, phone: v }))}
                    placeholder="+44 7700 900000"
                    type="tel"
                    value={profile.phone ?? ""}
                  />
                </Field>
              </div>
              {status ? (
                <p className="mt-4 rounded-[10px] bg-[#FEE9E9] px-4 py-3 text-sm text-[#C0272D]">{status}</p>
              ) : null}
              <button
                className="mt-5 flex items-center gap-2 rounded-full font-semibold text-white transition"
                disabled={saving}
                style={{
                  height: "46px",
                  padding: "0 24px",
                  fontSize: "15px",
                  background: saving ? "#8072B1" : "linear-gradient(90deg,#524096 0%,#8072B1 100%)",
                  border: "none",
                  cursor: saving ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
                type="submit"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </SectionCard>

            <SectionCard subtitle="Choose how you hear from us" title="Notifications">
              <div className="flex flex-col" style={{ gap: 0 }}>
                {(["email", "sms", "push"] as const).map((pref, i) => (
                  <div key={pref} style={{ borderTop: i > 0 ? "1px solid #F0EDF8" : "none" }}>
                    <Toggle
                      checked={profile.notification_preferences[pref]}
                      label={{ email: "Email notifications", sms: "SMS notifications", push: "Push notifications" }[pref]}
                      onChange={(v) =>
                        setProfile((c) => ({
                          ...c,
                          notification_preferences: { ...c.notification_preferences, [pref]: v },
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </SectionCard>

          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">

            <SectionCard subtitle="Share it and you both earn £10" title="Referral code">
              <div
                className="flex items-center justify-between rounded-[12px]"
                style={{ background: "#F3F4F6", padding: "14px 18px" }}
              >
                <span style={{ fontFamily: "monospace", fontSize: "22.8px", fontWeight: 700, letterSpacing: "0.1em", color: "#524096" }}>
                  {profile.referral_code}
                </span>
                <button
                  className="flex items-center gap-1.5 rounded-full font-semibold transition hover:bg-[#ECE8F6]"
                  onClick={() => {
                    void navigator.clipboard.writeText(profile.referral_code);
                    success({ kind: "done", title: "Code copied", note: "Share it with a friend and you both win." });
                  }}
                  style={{ height: "36px", padding: "0 14px", fontSize: "13.5px", color: "#524096", border: "1.5px solid #D4CCEA", background: "white", cursor: "pointer", fontFamily: "inherit" }}
                  type="button"
                >
                  <Copy style={{ width: "14px", height: "14px" }} />
                  Copy
                </button>
              </div>
              <button
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full font-semibold transition hover:bg-[#ECE8F6]"
                onClick={() => {
                  const link = `${window.location.origin}/signup?ref=${profile.referral_code}`;
                  void navigator.clipboard.writeText(link);
                  success({ kind: "done", title: "Invite link copied", note: "Send it along, they'll thank you later." });
                }}
                style={{ height: "46px", fontSize: "14.5px", color: "#524096", border: "1.5px solid #D4CCEA", background: "transparent", cursor: "pointer", fontFamily: "inherit", borderRadius: "9999px" }}
                type="button"
              >
                <Share2 style={{ width: "16px", height: "16px" }} />
                Share invite link
              </button>
              <p style={{ fontSize: "12.5px", color: "#8B8798", lineHeight: "18px", marginTop: "12px" }}>
                Friends get £10 off their first booking. You get a £10 voucher after their first completed clean — up to 10 active referrals.
              </p>
            </SectionCard>

            <SectionCard title="Account">
              <div className="flex flex-col gap-2">
                {[
                  { href: "/addresses", Icon: MapPin, label: "Manage addresses" },
                  { href: "/payments", Icon: CreditCard, label: "Payments & receipts" },
                ].map(({ href, Icon, label }) => (
                  <Link
                    className="flex items-center gap-3 rounded-[12px] font-semibold transition hover:bg-[#F3F4F6]"
                    href={href}
                    key={href}
                    style={{ height: "50px", padding: "0 16px", fontSize: "15px", color: "#1E1848", textDecoration: "none" }}
                  >
                    <Icon style={{ width: "18px", height: "18px", color: "#524096", flexShrink: 0 }} />
                    {label}
                    <svg className="ml-auto" fill="none" height={16} stroke="#C4BFD4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" width={16}><path d="M9 18l6-6-6-6" /></svg>
                  </Link>
                ))}
                <button
                  className="flex items-center gap-3 rounded-[12px] font-semibold transition hover:bg-[#FEF0EF]"
                  disabled={portalBusy}
                  onClick={() => void openPortal()}
                  style={{ height: "50px", padding: "0 16px", fontSize: "15px", color: "#1E1848", border: "none", background: "transparent", cursor: portalBusy ? "not-allowed" : "pointer", fontFamily: "inherit", textAlign: "left" }}
                  type="button"
                >
                  <CreditCard style={{ width: "18px", height: "18px", color: "#524096", flexShrink: 0 }} />
                  {portalBusy ? "Opening…" : "Payment methods"}
                </button>
                {portalStatus ? (
                  <p className="rounded-[10px] bg-[#F3F4F6] px-4 py-2 text-sm text-[#5F5F66]">{portalStatus}</p>
                ) : null}
                <div style={{ height: "1px", background: "#F0EDF8", margin: "4px 0" }} />
                <button
                  className="flex items-center gap-3 rounded-[12px] transition hover:bg-[#FEF0EF]"
                  onClick={() => void logout()}
                  style={{ height: "50px", padding: "0 16px", fontSize: "15px", color: "#C0272D", fontWeight: 600, border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
                  type="button"
                >
                  <LogOut style={{ width: "18px", height: "18px", flexShrink: 0 }} />
                  Sign out
                </button>
              </div>
            </SectionCard>

          </div>
        </div>
      </div>
    </form>
  );
}
