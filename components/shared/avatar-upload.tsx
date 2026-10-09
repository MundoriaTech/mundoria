"use client";

import { Check, UserRound } from "lucide-react";
import { useState } from "react";

import { ActionError } from "@/components/shared/action-error";
import {
  FileUpload,
  type FileUploadResult,
} from "@/components/shared/file-upload";
import {
  DEFAULT_AVATARS,
  avatarImageClass,
  isDefaultAvatarUrl,
  mundoriaCharacter,
  resolveAvatarUrl,
} from "@/lib/avatars/default-pack";
import { ownStoragePath } from "@/lib/storage/own-object";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function AvatarUpload({
  className,
  currentUrl,
  keepFiles = [],
  onUpload,
  userId,
}: {
  className?: string;
  currentUrl: string | null;
  /** Stored files that must stay, such as a submitted cleaner headshot. */
  keepFiles?: Array<string | null | undefined>;
  onUpload: (url: string) => void | Promise<void>;
  userId: string;
}) {
  const [url, setUrl] = useState(currentUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedDefaultId = mundoriaCharacter(url);

  async function persistAvatar(nextUrl: string) {
    const previousUrl = url;
    const supabase = createBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      throw new Error("You can only update your own avatar.");
    }

    const { data, error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: nextUrl })
      .eq("id", user.id)
      .select("avatar_url")
      .single();

    if (updateError) throw new Error(updateError.message);
    if (!data?.avatar_url) {
      throw new Error("The avatar was chosen, but your profile was not updated.");
    }

    setUrl(data.avatar_url);
    await onUpload(data.avatar_url);
    await discardReplacedUpload(previousUrl, data.avatar_url);
  }

  async function discardReplacedUpload(previous: string | null, next: string) {
    if (!previous || previous === next) return;
    if (keepFiles.some((file) => file && file === previous)) return;
    const path = ownStoragePath("avatars", previous, userId);
    if (!path) return;
    await createBrowserClient().storage.from("avatars").remove([path]);
  }

  async function completeUpload(result: FileUploadResult) {
    setError(null);
    await persistAvatar(result.publicUrl);
  }

  async function selectDefault(src: string) {
    if (saving || url === src) return;
    setSaving(true);
    setError(null);
    try {
      await persistAvatar(src);
    } catch (selectError) {
      setError(
        selectError instanceof Error
          ? selectError.message
          : "Couldn’t update avatar.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-primary ring-2 ring-border">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt="Profile avatar"
              className={avatarImageClass(resolveAvatarUrl(url, userId))}
              src={resolveAvatarUrl(url, userId)}
            />
          ) : (
            <UserRound className="h-8 w-8" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-foreground">Profile photo</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a Mundoria look, or upload your own photo.
          </p>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-foreground">Mundoria looks</p>
        <div className="mt-3 flex gap-4">
          {DEFAULT_AVATARS.map((avatar, index) => {
            const selected = selectedDefaultId === avatar.id;
            return (
              <button
                aria-label={`Use Mundoria look ${index + 1}`}
                aria-pressed={selected}
                className={cn(
                  "rounded-xl p-1 transition",
                  saving && "pointer-events-none opacity-70",
                )}
                disabled={saving}
                key={avatar.id}
                onClick={() => void selectDefault(avatar.src)}
                type="button"
              >
                <span
                  className={cn(
                    "relative block h-16 w-16 overflow-hidden rounded-full ring-2 transition",
                    selected
                      ? "ring-[#221f50] ring-offset-2 ring-offset-background"
                      : "ring-transparent hover:ring-border",
                  )}
                  style={{ backgroundColor: avatar.tint }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt=""
                    className={avatarImageClass(avatar.src)}
                    src={avatar.src}
                  />
                  {selected ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-[#221f50]/35">
                      <Check className="h-5 w-5 text-white" strokeWidth={3} />
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <FileUpload
          accept={["image/jpeg", "image/png", "image/webp"]}
          bucket="avatars"
          label={isDefaultAvatarUrl(url) ? "Upload a photo" : "Change photo"}
          maxSizeMb={5}
          onUpload={completeUpload}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          JPEG, PNG or WebP · max 5 MB
        </p>
        {error ? (
          <div className="mt-2">
            <ActionError message={error} title="Couldn’t update your photo" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
