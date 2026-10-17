"use client";

import Link from "next/link";
import { ChevronDown, MapPin, Star } from "lucide-react";
import { useEffect, useState } from "react";

import { bookingHrefWithDirectoryCleaner } from "@/lib/seo/birmingham-directory";
import { cn } from "@/lib/utils";

export type FeaturedCleanerCardData = {
  areas: string;
  avatarUrl?: string | null;
  href?: string;
  jobs?: number;
  name: string;
  prefixes?: string[];
  radiusMiles?: number | null;
  rating: number;
  reviewCount?: number;
};

function cleanerKey(cleaner: FeaturedCleanerCardData) {
  return cleaner.href ?? cleaner.name;
}

function CleanerAvatar({ cleaner }: { cleaner: FeaturedCleanerCardData }) {
  if (cleaner.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt=""
        className="h-12 w-12 shrink-0 rounded-full object-cover object-top ring-2 ring-[#c79c66] sm:h-14 sm:w-14"
        src={cleaner.avatarUrl}
      />
    );
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#efe6ff] text-xs font-bold text-[#5b3d9e] ring-2 ring-[#c79c66] sm:h-14 sm:w-14 sm:text-sm">
      {cleaner.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)}
    </div>
  );
}

function FeaturedCleanerCard({
  bookingHref,
  cleaner,
  onToggle,
  open,
}: {
  bookingHref: string;
  cleaner: FeaturedCleanerCardData;
  onToggle: () => void;
  open: boolean;
}) {
  const area = cleaner.areas.split("·")[0]?.trim() || cleaner.areas;
  const ratingLabel =
    cleaner.rating > 0 ? `${cleaner.rating.toFixed(1)} / 5` : "New";
  const detail = [
    cleaner.reviewCount
      ? `${cleaner.reviewCount} review${cleaner.reviewCount === 1 ? "" : "s"}`
      : null,
    cleaner.jobs ? `${cleaner.jobs} jobs` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const bookHref = bookingHrefWithDirectoryCleaner(bookingHref, {
    name: cleaner.name,
    prefixes: cleaner.prefixes ?? [],
  });

  return (
    <article
      className={cn(
        "rounded-2xl bg-white shadow-[0_8px_22px_rgba(28,19,59,0.08)] transition duration-300",
        open && "shadow-[0_12px_28px_rgba(28,19,59,0.12)]",
      )}
    >
      <button
        aria-expanded={open}
        aria-label={`${open ? "Hide" : "Show"} booking options for ${cleaner.name}`}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left sm:gap-3.5 sm:px-4 sm:py-3.5"
        onClick={onToggle}
        type="button"
      >
        <CleanerAvatar cleaner={cleaner} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-[0.95rem] font-bold tracking-[-0.02em] text-[#1c133b] sm:text-base">
              {cleaner.name}
            </h3>
            <ChevronDown
              aria-hidden
              className={cn(
                "mt-0.5 size-4 shrink-0 text-[#8a8498] transition-transform duration-300",
                open && "rotate-180 text-[#1c133b]",
              )}
            />
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-[12px] text-[#6b6578]">
            <MapPin
              aria-hidden
              className="size-3 shrink-0 text-[#c79c66]"
              strokeWidth={2.25}
            />
            <span className="truncate">{area}</span>
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-1 text-[11px] font-medium text-[#1c133b] sm:text-[12px]">
            <span className="inline-flex items-center gap-0.5">
              <Star
                aria-hidden
                className={cn(
                  "size-3",
                  cleaner.rating > 0
                    ? "fill-[#c79c66] text-[#c79c66]"
                    : "text-[#c79c66]",
                )}
              />
              {ratingLabel}
            </span>
            {detail ? <span className="text-[#8a8498]">· {detail}</span> : null}
          </p>
        </div>
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div
            className={cn(
              "border-t border-[#ece7f5] px-3.5 pb-3.5 pt-3 sm:px-4 sm:pb-4",
              cleaner.href ? "grid grid-cols-2 gap-2" : "flex",
            )}
          >
            {cleaner.href ? (
              <Link
                className="inline-flex h-9 items-center justify-center rounded-full border border-[#1c133b]/20 bg-white px-3 text-[12px] font-semibold text-[#1c133b] transition hover:border-[#1c133b] hover:bg-[#f7f2fc]"
                href={cleaner.href}
                onClick={(event) => event.stopPropagation()}
              >
                View profile
              </Link>
            ) : null}
            <Link
              className="inline-flex h-9 flex-1 items-center justify-center rounded-full bg-[#1c133b] px-3 text-[12px] font-semibold text-white transition hover:bg-[#1c133b]/90"
              href={bookHref}
              onClick={(event) => event.stopPropagation()}
            >
              Book
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

const INITIAL_CLEANER_COUNT = 6;

export function FeaturedCleanerCards({
  bookingHref = "/booking/new",
  cleaners,
}: {
  bookingHref?: string;
  cleaners: FeaturedCleanerCardData[];
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? cleaners : cleaners.slice(0, INITIAL_CLEANER_COUNT);
  const hiddenCount = Math.max(0, cleaners.length - INITIAL_CLEANER_COUNT);

  useEffect(() => {
    if (!openKey) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-cleaner-card]")) return;
      setOpenKey(null);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenKey(null);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openKey]);

  return (
    <div>
      <div className="mt-6 grid items-start gap-2.5 sm:mt-8 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3">
        {visible.map((cleaner) => {
          const key = cleanerKey(cleaner);
          return (
            <div data-cleaner-card key={key}>
              <FeaturedCleanerCard
                bookingHref={bookingHref}
                cleaner={cleaner}
                onToggle={() =>
                  setOpenKey((current) => (current === key ? null : key))
                }
                open={openKey === key}
              />
            </div>
          );
        })}
      </div>
      {hiddenCount > 0 ? (
        <div className="mt-5 flex justify-center">
          <button
            className="inline-flex h-10 items-center justify-center rounded-full border border-[#1c133b]/15 bg-white px-5 text-sm font-semibold text-[#1c133b] transition hover:border-[#1c133b] hover:bg-[#f7f2fc]"
            onClick={() => setShowAll((current) => !current)}
            type="button"
          >
            {showAll ? "See fewer" : "See more"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
