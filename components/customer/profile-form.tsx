"use client";

import {
  BellRing,
  Copy,
  CreditCard,
  LogOut,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AvatarUpload } from "@/components/shared/avatar-upload";
import { useFeedback } from "@/components/shared/feedback-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/auth";

export function ProfileForm({ initialProfile }: { initialProfile: Profile }) {
  const router = useRouter();
  const { success } = useFeedback();
  const [profile, setProfile] = useState(initialProfile);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    const { error } = await createBrowserClient()
      .from("profiles")
      .update({
        full_name: profile.full_name.trim(),
        notification_preferences: profile.notification_preferences,
        phone: profile.phone?.trim() || null,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      setStatus(error.message);
      return;
    }
    success({
      kind: "saved",
      title: "Profile saved",
      note: "Your details are up to date.",
    });
    router.refresh();
  }

  async function openPortal() {
    setStatus("Opening secure payment settings…");
    const response = await fetch("/api/stripe/customer-portal", {
      method: "POST",
    });
    const result = (await response.json()) as { error?: string; url?: string };
    if (!response.ok || !result.url) {
      setStatus(result.error ?? "Unable to open payment settings.");
      return;
    }
    window.location.assign(result.url);
  }

  async function logout() {
    await createBrowserClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
      <form
        className="rounded-2xl border bg-background p-5 shadow-sm sm:p-7"
        onSubmit={saveProfile}
      >
        <AvatarUpload
          currentUrl={profile.avatar_url}
          onUpload={(url) => {
            setProfile((current) => ({ ...current, avatar_url: url }));
            success({
              kind: "updated",
              title: "Photo updated",
              note: "Looking sharp.",
            });
          }}
          userId={profile.id}
        />

        <div className="mt-7 space-y-4">
          <label className="block space-y-2 text-sm font-medium">
            <span>Full name</span>
            <Input
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  full_name: event.target.value,
                }))
              }
              value={profile.full_name}
            />
          </label>
          <label className="block space-y-2 text-sm font-medium">
            <span>Email</span>
            <Input disabled value={profile.email} />
          </label>
          <label className="block space-y-2 text-sm font-medium">
            <span>Phone</span>
            <Input
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
              type="tel"
              value={profile.phone ?? ""}
            />
          </label>
        </div>

        <div className="mt-7">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Notification preferences</h2>
          </div>
          <div className="mt-3 space-y-3 rounded-xl bg-muted/50 p-4">
            {(["email", "sms", "push"] as const).map((preference) => (
              <label
                className="flex items-center justify-between text-sm capitalize"
                key={preference}
              >
                {preference} notifications
                <input
                  checked={profile.notification_preferences[preference]}
                  className="h-4 w-4 accent-emerald-700"
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      notification_preferences: {
                        ...current.notification_preferences,
                        [preference]: event.target.checked,
                      },
                    }))
                  }
                  type="checkbox"
                />
              </label>
            ))}
          </div>
        </div>

        {status ? (
          <p className="mt-4 rounded-md bg-muted p-3 text-sm">{status}</p>
        ) : null}
        <Button className="mt-6" disabled={saving} type="submit">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </form>

      <div className="space-y-4">
        <section className="rounded-2xl border bg-background p-5 shadow-sm">
          <h2 className="font-semibold">Referral code</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Share it with friends so you can both earn vouchers.
          </p>
          <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-muted px-4 py-3">
            <span className="font-mono text-lg font-bold tracking-wider text-foreground">
              {profile.referral_code}
            </span>
            <Button
              onClick={() => {
                void navigator.clipboard.writeText(profile.referral_code);
                success({
                  kind: "done",
                  title: "Code copied",
                  note: "Share it with a friend and you both win.",
                });
              }}
              size="sm"
              variant="ghost"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
          </div>
          <Button
            className="mt-3 w-full"
            onClick={() => {
              const link = `${window.location.origin}/signup?ref=${profile.referral_code}`;
              void navigator.clipboard.writeText(link);
              success({
                kind: "done",
                title: "Invite link copied",
                note: "Send it along — they’ll thank you later.",
              });
            }}
            size="sm"
            variant="outline"
          >
            Copy invite link
          </Button>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            Friends get £10 off first booking. You get a £10 voucher after their
            first completed clean (up to 10 active referrals).
          </p>
        </section>

        <section className="rounded-2xl border bg-background p-5 shadow-sm">
          <h2 className="font-semibold">Account tools</h2>
          <div className="mt-4 grid gap-2">
            <Button asChild className="justify-start" variant="outline">
              <Link href="/addresses">
                <MapPin className="mr-2 h-4 w-4" />
                Manage addresses
              </Link>
            </Button>
            <Button
              className="justify-start"
              onClick={() => void openPortal()}
              variant="outline"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Payment methods
            </Button>
            <Button asChild className="justify-start" variant="outline">
              <Link href="/payments">
                <CreditCard className="mr-2 h-4 w-4" />
                Payments & receipts
              </Link>
            </Button>
            <Button
              className="justify-start text-destructive"
              onClick={() => void logout()}
              variant="ghost"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
