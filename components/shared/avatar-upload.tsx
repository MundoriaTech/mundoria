"use client";

import { UserRound } from "lucide-react";
import { useState } from "react";

import {
  FileUpload,
  type FileUploadResult,
} from "@/components/shared/file-upload";
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

  async function completeUpload(result: FileUploadResult) {
    const supabase = createBrowserClient();
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: result.publicUrl })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    setUrl(result.publicUrl);
    await onUpload(result.publicUrl);
  }

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-primary">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="Profile avatar" className="h-full w-full object-cover" src={url} />
        ) : (
          <UserRound className="h-8 w-8" />
        )}
      </div>
      <div>
        <FileUpload
          accept={["image/jpeg", "image/png", "image/webp"]}
          bucket="avatars"
          label="Change avatar"
          maxSizeMb={5}
          onUpload={completeUpload}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          JPEG, PNG or WebP · max 5 MB
        </p>
      </div>
    </div>
  );
}
