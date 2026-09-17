"use client";

import {
  Broom,
  HouseLine,
  MapPinArea,
  Newspaper,
  Plant,
  UsersThree,
  type Icon,
} from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

const ICON_SHADOW =
  "[filter:drop-shadow(0_0_1.5px_#fff)_drop-shadow(0_0_1.5px_#fff)_drop-shadow(0_0_1.5px_#fff)_drop-shadow(0_6px_12px_rgba(49,44,121,0.16))]";

const BY_CATEGORY: Record<
  string,
  { Icon: Icon; iconClass: string }
> = {
  "Cleaning Tips": {
    Icon: Broom,
    iconClass:
      "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#f0a888] [&_path:last-child]:!fill-[#312c79]",
  },
  "Home Care": {
    Icon: Plant,
    iconClass:
      "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#e0c2d4] [&_path:last-child]:!fill-[#b85a8a]",
  },
  "Host Tips": {
    Icon: HouseLine,
    iconClass:
      "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#ffffff] [&_path:last-child]:!fill-[#2f6f6a]",
  },
  "Birmingham Life": {
    Icon: MapPinArea,
    iconClass:
      "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#b7d0ea] [&_path:last-child]:!fill-[#4a7ab5]",
  },
  "Cleaner Stories": {
    Icon: UsersThree,
    iconClass:
      "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#c4b5e8] [&_path:last-child]:!fill-[#312c79]",
  },
  "Company News": {
    Icon: Newspaper,
    iconClass:
      "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#ffffff] [&_path:last-child]:!fill-[#5c5a66]",
  },
};

export function MagCategoryIcon({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  const visual = BY_CATEGORY[category] ?? BY_CATEGORY["Cleaning Tips"];
  const { Icon } = visual;
  return (
    <Icon
      aria-hidden
      className={cn("h-12 w-12 shrink-0", ICON_SHADOW, visual.iconClass, className)}
      weight="duotone"
    />
  );
}
