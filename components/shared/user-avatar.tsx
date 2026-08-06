"use client";

import { resolveAvatarUrl } from "@/lib/avatars/default-pack";
import { cn } from "@/lib/utils";

export function UserAvatar({
  className,
  name,
  seed,
  size = "md",
  url,
}: {
  className?: string;
  name?: string | null;
  /** Stable seed for default pack when no photo (user id preferred). */
  seed?: string | null;
  size?: "sm" | "md" | "lg";
  url?: string | null;
}) {
  const dims =
    size === "lg" ? "h-16 w-16" : size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const resolved = resolveAvatarUrl(url, seed ?? name);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted",
        dims,
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" className="h-full w-full object-cover" src={resolved} />
    </span>
  );
}
