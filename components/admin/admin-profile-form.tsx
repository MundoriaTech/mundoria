"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ChangeEmailForm } from "@/components/auth/change-email-form";
import { AvatarUpload } from "@/components/shared/avatar-upload";
import { useFeedback } from "@/components/shared/feedback-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/auth";

export function AdminProfileForm({
  initialProfile,
}: {
  initialProfile: Profile;
}) {
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
      note: "Other admins will see the update on the team page.",
    });
    router.refresh();
  }

  return (
    <form
      className="rounded-xl border border-border bg-card p-4 sm:p-5"
      onSubmit={(event) => void saveProfile(event)}
    >
      <h2 className="font-semibold">Your profile</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Phone and photo shown to other admins on the team page.
      </p>

      <div className="mt-5">
        <AvatarUpload
          currentUrl={profile.avatar_url}
          onUpload={(url) => {
            setProfile((current) => ({ ...current, avatar_url: url }));
            success({
              kind: "updated",
              title: "Photo updated",
              note: "Looking good for the team directory.",
            });
            router.refresh();
          }}
          userId={profile.id}
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2 text-sm font-medium">
          <span>Full name</span>
          <Input disabled readOnly value={profile.full_name} />
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
            value={profile.phone ?? ""}
          />
        </label>
        <div className="sm:col-span-2">
          <ChangeEmailForm currentEmail={profile.email} />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button className="w-full sm:w-auto" disabled={saving} type="submit">
          {saving ? "Saving…" : "Save profile"}
        </Button>
        {status ? (
          <p className="text-sm text-muted-foreground">{status}</p>
        ) : null}
      </div>
    </form>
  );
}
