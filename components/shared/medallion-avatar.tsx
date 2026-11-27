"use client";

import { useState } from "react";

import { AvatarLightbox } from "@/components/shared/avatar-lightbox";
import { avatarImageClass, resolveAvatarUrl } from "@/lib/avatars/default-pack";
import {
  cleanerTierLabel,
  normalizeMedallionTier,
} from "@/lib/cleaner/tier";
import { cn } from "@/lib/utils";
import type { CleanerTier } from "@/types/cleaner";

/** Metal tones for the medallion ring around a cleaner avatar. */
const MEDALLION_RING: Record<
  "bronze" | "silver" | "gold" | "rose_gold",
  { dark: string; light: string; mid: string }
> = {
  bronze: { dark: "#6B3F16", light: "#E2B888", mid: "#B87333" },
  silver: { dark: "#5C616A", light: "#F2F3F5", mid: "#A8ADB6" },
  gold: { dark: "#8A6508", light: "#F8E59A", mid: "#D4AF37" },
  rose_gold: { dark: "#7A3D48", light: "#F7D4CA", mid: "#C97984" },
};

const SIZES = {
  sm: { box: "h-10 w-10", text: "text-[12px]" },
  md: { box: "h-[64px] w-[64px]", text: "text-[16px]" },
  lg: { box: "h-[88px] w-[88px]", text: "text-[22px]" },
} as const;

/** Cleaner photo framed by the current medallion metal ring. */
export function MedallionAvatar({
  avatarUrl,
  className,
  name,
  preview = true,
  seed,
  size = "md",
  tier,
}: {
  avatarUrl?: string | null;
  className?: string;
  name: string;
  /** Tap to open a larger photo. Turn off inside menus or other buttons. */
  preview?: boolean;
  seed?: string | null;
  size?: keyof typeof SIZES;
  tier: CleanerTier;
}) {
  const [open, setOpen] = useState(false);
  const visual = normalizeMedallionTier(tier) as keyof typeof MEDALLION_RING;
  const ring = MEDALLION_RING[visual] ?? MEDALLION_RING.silver;
  const label = cleanerTierLabel(tier);
  const dims = SIZES[size];
  const resolved = resolveAvatarUrl(avatarUrl, seed ?? name);

  const face = (
    <div
      className="absolute inset-0 rounded-full p-[3px]"
      style={{
        background: `linear-gradient(160deg, ${ring.light} 0%, ${ring.mid} 38%, ${ring.dark} 72%, ${ring.light} 100%)`,
        boxShadow: `0 2px 6px ${ring.dark}40, inset 0 1px 0 ${ring.light}`,
      }}
    >
      <div
        className="h-full w-full rounded-full p-[4px]"
        style={{
          background: `linear-gradient(320deg, ${ring.dark} 0%, ${ring.light} 45%, ${ring.mid} 100%)`,
        }}
      >
        <div
          className={cn(
            "flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white font-bold text-[#524096] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.9)]",
            dims.text,
          )}
        >
          {resolved ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={name}
              className={avatarImageClass(resolved)}
              src={resolved}
            />
          ) : (
            name.charAt(0)
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {preview ? (
        <button
          aria-label={`View ${name}'s photo`}
          className={cn(
            "relative shrink-0 cursor-zoom-in border-0 bg-transparent p-0 transition hover:brightness-95",
            dims.box,
            className,
          )}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setOpen(true);
          }}
          title={`${label} medallion`}
          type="button"
        >
          {face}
        </button>
      ) : (
        <div
          className={cn("relative shrink-0", dims.box, className)}
          title={`${label} medallion`}
        >
          {face}
        </div>
      )}

      {open && resolved ? (
        <AvatarLightbox
          alt={name}
          caption={`${label} medallion`}
          onClose={() => setOpen(false)}
          src={resolved}
          title={name}
        />
      ) : null}
    </>
  );
}
