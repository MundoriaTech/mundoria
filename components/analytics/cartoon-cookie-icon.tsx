"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

/** CleanScape cookie palette — warm baked golds. */
const COOKIE = {
  center: "#f7e4a8",
  mid: "#f0cf7a",
  edge: "#d4a056",
  crust: "#b8843f",
  chip: "#6b3f1f",
  chipMid: "#8b5a24",
  chipGloss: "#c4956a",
  crumb: "#e8bcac",
  shadow: "#ac742f",
} as const;

function Chip({
  cx,
  cy,
  r,
  rotate = 0,
}: {
  cx: number;
  cy: number;
  r: number;
  rotate?: number;
}) {
  return (
    <g transform={`rotate(${rotate} ${cx} ${cy})`}>
      <ellipse cx={cx} cy={cy + 0.4} fill="#000" opacity="0.12" rx={r + 0.3} ry={r * 0.55} />
      <path
        d={`M${cx - r} ${cy + 0.5}
           C${cx - r * 0.55} ${cy - r * 1.05} ${cx + r * 0.45} ${cy - r * 1.1} ${cx + r} ${cy + 0.2}
           C${cx + r * 0.95} ${cy + r * 0.85} ${cx - r * 0.35} ${cy + r * 0.95} ${cx - r} ${cy + 0.5}
           Z`}
        fill={COOKIE.chip}
      />
      <path
        d={`M${cx - r * 0.55} ${cy - r * 0.15}
           C${cx - r * 0.2} ${cy - r * 0.75} ${cx + r * 0.35} ${cy - r * 0.7} ${cx + r * 0.55} ${cy - r * 0.05}
           C${cx + r * 0.15} ${cy + r * 0.35} ${cx - r * 0.35} ${cy + r * 0.4} ${cx - r * 0.55} ${cy - r * 0.15}
           Z`}
        fill={COOKIE.chipMid}
      />
      <ellipse
        cx={cx - r * 0.25}
        cy={cy - r * 0.35}
        fill={COOKIE.chipGloss}
        opacity="0.55"
        rx={r * 0.28}
        ry={r * 0.16}
      />
    </g>
  );
}

export function CartoonCookieIcon({
  className,
  size = 48,
}: {
  className?: string;
  size?: number;
}) {
  const bodyGradientId = useId();
  const edgeGradientId = useId();

  /** Slightly irregular baked disc — reads round at a glance, wobbly up close. */
  const cookieBody =
    "M32 9.5 C41.2 8.2 50.8 12.8 54.8 21.2 C58.8 29.6 57.2 40.2 50.6 47.4 C44 54.6 33.8 57.4 24.2 54.6 C14.6 51.8 8.2 43.4 8.6 33.4 C9 23.4 16.4 14.4 25.6 11.2 C27.4 10.5 29.6 9.8 32 9.5 Z";

  /** Bite taken from the upper-right — inner edge + crumbs. */
  const biteCutout =
    "M44.5 12.5 C48.8 11.8 52.8 14.6 54.2 18.8 C55.4 22.4 53.8 25.8 50.8 27.2 C47.6 28.6 44.2 27.4 42.6 24.6 C41.2 22.2 42.2 18.8 44.5 12.5 Z";

  return (
    <svg
      aria-hidden="true"
      className={cn("shrink-0 drop-shadow-[0_3px_6px_rgba(172,116,47,0.35)]", className)}
      fill="none"
      height={size}
      viewBox="0 0 64 64"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient
          cx="0"
          cy="0"
          gradientTransform="translate(30 30) scale(26)"
          gradientUnits="userSpaceOnUse"
          id={bodyGradientId}
          r="1"
        >
          <stop stopColor={COOKIE.center} />
          <stop offset="0.55" stopColor={COOKIE.mid} />
          <stop offset="0.88" stopColor={COOKIE.edge} />
          <stop offset="1" stopColor={COOKIE.crust} />
        </radialGradient>
        <linearGradient id={edgeGradientId} x1="10" x2="54" y1="10" y2="54">
          <stop stopColor="#fff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${bodyGradientId}-clip`}>
          <path d={cookieBody} />
        </clipPath>
      </defs>

      {/* Soft base shadow */}
      <ellipse cx="32" cy="54" fill={COOKIE.shadow} opacity="0.18" rx="22" ry="3.5" />

      {/* Main cookie disc */}
      <path
        d={cookieBody}
        fill={`url(#${bodyGradientId})`}
        stroke={COOKIE.crust}
        strokeLinejoin="round"
        strokeWidth="1.8"
      />

      {/* Baked surface sheen */}
      <path
        d={cookieBody}
        fill={`url(#${edgeGradientId})`}
        opacity="0.55"
      />

      {/* Subtle crack / bake lines */}
      <g clipPath={`url(#${bodyGradientId}-clip`} opacity="0.35" stroke={COOKIE.crust} strokeLinecap="round">
        <path d="M18 28 C21 30 23 34 20 38" strokeWidth="0.9" />
        <path d="M36 42 C39 40 42 43 40 46" strokeWidth="0.8" />
        <path d="M26 18 C28 20 27 23 25 24" strokeWidth="0.7" />
      </g>

      {/* Chocolate chips — domed, embedded in the dough */}
      <Chip cx={21} cy={27} r={4.1} rotate={-12} />
      <Chip cx={34} cy={22} r={3.6} rotate={8} />
      <Chip cx={27} cy={38} r={3.9} rotate={-22} />
      <Chip cx={40} cy={36} r={3.4} rotate={14} />
      <Chip cx={16} cy={40} r={2.9} rotate={6} />
      <Chip cx={45} cy={44} r={2.6} rotate={-8} />

      {/* Bite mark — exposes lighter inner crumb */}
      <path d={biteCutout} fill={COOKIE.center} stroke={COOKIE.edge} strokeWidth="1.2" />
      <path
        d="M44.8 14.2 C47.6 13.6 50.2 15.4 51.2 18.1 C51.9 20.1 50.8 22 48.8 22.8"
        opacity="0.45"
        stroke={COOKIE.crust}
        strokeLinecap="round"
        strokeWidth="1"
      />

      {/* Crumbs near the bite */}
      <circle cx="52.5" cy="20.5" fill={COOKIE.mid} r="1.1" stroke={COOKIE.crust} strokeWidth="0.4" />
      <circle cx="54.2" cy="24.2" fill={COOKIE.edge} r="0.85" />
      <circle cx="50.8" cy="26.5" fill={COOKIE.crumb} r="0.75" />
      <circle cx="53.4" cy="17.8" fill={COOKIE.mid} r="0.65" />

      {/* Crispy edge speckles */}
      <g opacity="0.5">
        <circle cx="13" cy="31" fill={COOKIE.crust} r="0.55" />
        <circle cx="48" cy="50" fill={COOKIE.crust} r="0.5" />
        <circle cx="52" cy="33" fill={COOKIE.crust} r="0.45" />
        <circle cx="11" cy="42" fill={COOKIE.crust} r="0.45" />
      </g>
    </svg>
  );
}
