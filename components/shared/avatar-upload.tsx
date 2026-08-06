"use client";

import { Check, UserRound } from "lucide-react";
import { useState } from "react";

import {
  FileUpload,
  type FileUploadResult,
} from "@/components/shared/file-upload";
import {
  DEFAULT_AVATARS,
  isDefaultAvatarUrl,
} from "@/lib/avatars/default-pack";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function AvatarUpload({
  className,
  currentUrl,
  onUpload,
  userId,
}: {
  className?: string;
  currentUrl: string | null;
  onUpload: (url: string) => void | Promise<void>;
  userId: string;
}) {
  const [url, setUrl] = useState(currentUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedDefaultId = DEFAULT_AVATARS.find(
    (avatar) => url === avatar.src || (url?.endsWith(avatar.src) ?? false),
  )?.id;

  async function persistAvatar(nextUrl: string) {
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
              className="h-full w-full object-cover"
              src={url}
            />
          ) : (
            <UserRound className="h-8 w-8" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-foreground">Profile photo</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a CleanScape look, or upload your own.
          </p>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-foreground">CleanScape looks</p>
        <div className="mt-3 grid grid-cols-3 gap-x-2 gap-y-3 sm:grid-cols-6">
          {DEFAULT_AVATARS.map((avatar) => {
            const selected = selectedDefaultId === avatar.id;
            return (
              <button
                aria-label={`Use ${avatar.label} avatar`}
                aria-pressed={selected}
                className={cn(
                  "group flex flex-col items-center gap-1.5 rounded-xl p-1 transition",
                  saving && "pointer-events-none opacity-70",
                )}
                disabled={saving}
                key={avatar.id}
                onClick={() => void selectDefault(avatar.src)}
                type="button"
              >
                <span
                  className={cn(
                    "relative aspect-square w-full overflow-hidden rounded-full ring-2 transition",
                    selected
                      ? "ring-[#221f50] ring-offset-2 ring-offset-background"
                      : "ring-transparent group-hover:ring-border",
                  )}
                  style={{ backgroundColor: avatar.tint }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt=""
                    className="h-full w-full object-cover"
                    src={avatar.src}
                  />
                  {selected ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-[#221f50]/35">
                      <Check className="h-5 w-5 text-white" strokeWidth={3} />
                    </span>
                  ) : null}
                </span>
                <span
                  className={cn(
                    "text-center text-[11px] font-medium leading-tight sm:text-xs",
                    selected ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {avatar.label}
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
          <p className="mt-2 text-sm text-destructive">{error}</p>
        ) : null}
      </div>
    </div>
  );
}
