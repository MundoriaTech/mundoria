"use client";

import {
  CalendarBlank,
  CalendarCheck,
  CurrencyGbp,
  MapPin,
  Pulse,
  Sparkle,
  Star,
  UsersThree,
  type Icon,
} from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

const ICON_STICKER =
  "drop-shadow-[0_0_0.5px_#fff,0_0_1px_#fff,1px_0_0_#fff,0_1px_0_#fff,-1px_0_0_#fff,0_-1px_0_#fff,1px_1px_0_#fff,-1px_-1px_0_#fff,1px_-1px_0_#fff,-1px_1px_0_#fff,0_8px_16px_rgba(28,19,59,0.12)]";

const ICONS = {
  calendarBlank: CalendarBlank,
  calendarCheck: CalendarCheck,
  currencyGbp: CurrencyGbp,
  mapPin: MapPin,
  sparkle: Sparkle,
  star: Star,
  usersThree: UsersThree,
  pulse: Pulse,
} as const;

export type DashboardStatIcon = keyof typeof ICONS;

const TONES: Record<string, string> = {
  peachPurple:
    "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#f0a888] [&_path:last-child]:!fill-[#312c79]",
  lavenderOrange:
    "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#c4b5e8] [&_path:last-child]:!fill-[#d4694a]",
  lineOnly:
    "[&_path:first-child]:!opacity-0 [&_path:last-child]:!fill-[#312c79]",
};

export function DashboardStatTiles({
  items,
}: {
  items: Array<{
    icon: DashboardStatIcon;
    label: string;
    tone?: keyof typeof TONES;
    value: string;
  }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Glyph: Icon = ICONS[item.icon];
        return (
          <div
            className="relative overflow-hidden rounded-[1.5rem] bg-[#efe6ff] p-5 shadow-[0_12px_28px_rgba(49,44,121,0.06)]"
            key={item.label}
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#823fb2]">
              {item.label}
            </p>
            <p className="mt-2 pr-14 text-2xl font-semibold tracking-[-0.03em] text-[#1c133b]">
              {item.value}
            </p>
            <Glyph
              aria-hidden
              className={cn(
                "absolute bottom-3 right-3 h-11 w-11",
                ICON_STICKER,
                TONES[item.tone ?? "peachPurple"],
              )}
              weight="duotone"
            />
          </div>
        );
      })}
    </div>
  );
}
