"use client";

import { useState } from "react";

import { AvatarLightbox } from "@/components/shared/avatar-lightbox";
import { avatarImageClass, resolveAvatarUrl } from "@/lib/avatars/default-pack";
import { cn } from "@/lib/utils";

export function UserAvatar({
  className,
  name,
  preview = true,
  seed,
  size = "md",
  url,
}: {
  className?: string;
  name?: string | null;
  /** Tap to open a larger photo. Turn off inside menus or other buttons. */
  preview?: boolean;
  /** Stable seed for default pack when no photo (user id preferred). */
  seed?: string | null;
  size?: "sm" | "md" | "lg";
  url?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const dims =
    size === "lg" ? "h-16 w-16" : size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const resolved = resolveAvatarUrl(url, seed ?? name);
  const label = name?.trim() || "Profile photo";

  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" className={avatarImageClass(resolved)} src={resolved} />
  );

  return (
    <>
      {preview ? (
        <button
          aria-label={`View ${label}'s photo`}
          className={cn(
            "inline-flex shrink-0 cursor-zoom-in items-center justify-center overflow-hidden rounded-full bg-muted p-0 transition hover:brightness-95",
            dims,
            className,
          )}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setOpen(true);
          }}
          type="button"
        >
          {image}
        </button>
      ) : (
        <span
          className={cn(
            "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted",
            dims,
            className,
          )}
        >
          {image}
        </span>
      )}

      {open ? (
        <AvatarLightbox
          alt={label}
          onClose={() => setOpen(false)}
          src={resolved}
          title={label}
        />
      ) : null}
    </>
  );
}
