"use client";

import {
  BookOpenText,
  CalendarCheck,
  CaretRight,
  ChatCircleDots,
  HouseLine,
  IdentificationCard,
  RocketLaunch,
  ShieldCheck,
  Sparkle,
  Wallet,
  Wrench,
  type Icon,
} from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

const ICON_SHADOW =
  "[filter:drop-shadow(0_0_1.5px_#fff)_drop-shadow(0_0_1.5px_#fff)_drop-shadow(0_0_1.5px_#fff)_drop-shadow(0_6px_14px_rgba(49,44,121,0.18))]";

const COLLECTION_VISUAL = {
  "for-customers": {
    Icon: HouseLine,
    iconClass:
      "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#f0a888] [&_path:last-child]:!fill-[#312c79]",
  },
  "become-a-cleaner": {
    Icon: RocketLaunch,
    iconClass:
      "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#c4b5e8] [&_path:last-child]:!fill-[#d4694a]",
  },
  "cleaner-guide": {
    Icon: BookOpenText,
    iconClass:
      "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#ffffff] [&_path:last-child]:!fill-[#5b3d9e]",
  },
} as const;

const TOPIC_VISUAL: Record<string, { Icon: Icon; iconClass: string }> = {
  "Book a clean": {
    Icon: CalendarCheck,
    iconClass:
      "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#f0a888] [&_path:last-child]:!fill-[#312c79]",
  },
  "Manage my account": {
    Icon: IdentificationCard,
    iconClass:
      "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#c4b5e8] [&_path:last-child]:!fill-[#6a45b8]",
  },
  "Booking issues": {
    Icon: Wrench,
    iconClass:
      "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#ffffff] [&_path:last-child]:!fill-[#d4694a]",
  },
  "Services & cleaners": {
    Icon: Sparkle,
    iconClass:
      "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#f0a888] [&_path:last-child]:!fill-[#823fb2]",
  },
  "Getting started": {
    Icon: RocketLaunch,
    iconClass:
      "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#c4b5e8] [&_path:last-child]:!fill-[#d4694a]",
  },
  "Jobs & sessions": {
    Icon: CalendarCheck,
    iconClass:
      "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#ffffff] [&_path:last-child]:!fill-[#312c79]",
  },
  "Revenue & payouts": {
    Icon: Wallet,
    iconClass:
      "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#f0a888] [&_path:last-child]:!fill-[#2f6f6a]",
  },
  "Reputation & safety": {
    Icon: ShieldCheck,
    iconClass:
      "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#c4b5e8] [&_path:last-child]:!fill-[#312c79]",
  },
  "App & account": {
    Icon: ChatCircleDots,
    iconClass:
      "[&_path:first-child]:!opacity-100 [&_path:first-child]:!fill-[#ffffff] [&_path:last-child]:!fill-[#5b3d9e]",
  },
};

const DEFAULT_VISUAL = COLLECTION_VISUAL["for-customers"];
const DEFAULT_TOPIC = TOPIC_VISUAL["Book a clean"];

export function HelpCollectionIcon({
  slug,
  className,
  placement = "card",
}: {
  className?: string;
  placement?: "card" | "hero";
  slug: string;
}) {
  const visual =
    COLLECTION_VISUAL[slug as keyof typeof COLLECTION_VISUAL] ?? DEFAULT_VISUAL;
  const { Icon } = visual;
  return (
    <Icon
      aria-hidden
      className={cn(
        ICON_SHADOW,
        visual.iconClass,
        placement === "card"
          ? "pointer-events-none absolute bottom-4 right-4 h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]"
          : "h-16 w-16 sm:h-20 sm:w-20",
        className,
      )}
      weight="duotone"
    />
  );
}

export function HelpTopicIcon({
  topic,
  className,
}: {
  className?: string;
  topic: string;
}) {
  const visual = TOPIC_VISUAL[topic] ?? DEFAULT_TOPIC;
  const { Icon } = visual;
  return (
    <Icon
      aria-hidden
      className={cn("h-10 w-10 shrink-0", ICON_SHADOW, visual.iconClass, className)}
      weight="duotone"
    />
  );
}

export function HelpArticleChevron({ className }: { className?: string }) {
  return (
    <CaretRight
      aria-hidden
      className={cn("h-4 w-4 shrink-0 text-[#823fb2]", className)}
      weight="bold"
    />
  );
}
