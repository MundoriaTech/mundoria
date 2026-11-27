import Link from "next/link";

import {
  pillOutline,
  pillPrimary,
  pillPrimaryStyle,
  SectionBanner,
} from "@/components/customer/dashboard/section-banner";
import { avatarImageClass, resolveAvatarUrl } from "@/lib/avatars/default-pack";
import { cleanerTierLabel, medallionIconSrc } from "@/lib/cleaner/tier";
import type { Booking } from "@/types/customer";

type Stage = {
  detail: string;
  /** Pulsing dot for stages happening right now. */
  live: boolean;
  pill: string;
  /** Chip colours, light-ground versions of the dashboard status chips. */
  tone: string;
  title: string;
};

const AMBER = "bg-[#FFF1DB] text-[#8A5200]";
const PURPLE = "bg-[#ECE8F6] text-[#524096]";
const GREEN = "bg-[#E3F5EA] text-[#13693A]";
const GREY = "bg-[#ECEBF1] text-[#4A4560]";
const RED = "bg-[#FFE6E1] text-[#9A2B18]";

function clock(time: string | null | undefined) {
  return String(time ?? "").slice(0, 5);
}

function dayLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    weekday: "short",
  });
}

function endTime(start: string, hours: number | null | undefined) {
  const [h, m] = clock(start).split(":").map(Number);
  const total = h * 60 + m + Math.round(Number(hours ?? 0) * 60);
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Where the visit is now, in words the customer can act on. */
function stageFor(booking: Booking, cleanerFirst: string | null, holdAtLabel: string | null): Stage {
  const when = `${dayLabel(booking.scheduled_date)} at ${clock(booking.scheduled_start_time)}`;
  const name = cleanerFirst ?? "Your cleaner";
  switch (booking.status) {
    case "pending_match":
    case "matched":
      return {
        detail: "We're finding the right cleaner for you and will email you as soon as they're confirmed.",
        live: false,
        pill: "Finding your cleaner",
        title: "Arranging your clean",
        tone: AMBER,
      };
    case "awaiting_payment":
      return {
        detail: holdAtLabel
          ? `We'll confirm your visit when we place the card hold on ${holdAtLabel}. Nothing to do.`
          : "We're placing the card hold now to confirm your visit.",
        live: false,
        pill: "Cleaner accepted",
        title: `${name} has accepted`,
        tone: PURPLE,
      };
    case "confirmed":
      return {
        detail: `${name} will arrive ${when}.`,
        live: false,
        pill: "Confirmed",
        title: "You're all set",
        tone: GREEN,
      };
    case "cleaner_en_route":
      return booking.arrived_at
        ? {
            detail: `${name} has arrived and is getting ready to start.`,
            live: true,
            pill: "Arrived",
            title: `${name} has arrived`,
            tone: GREEN,
          }
        : {
            detail: "Follow them on the map as they travel to you.",
            live: true,
            pill: "On the way",
            title: `${name} is on the way`,
            tone: PURPLE,
          };
    case "in_progress":
      return {
        detail: `Booked until ${endTime(booking.scheduled_start_time, booking.estimated_duration_hours)}. The countdown shows the time left.`,
        live: true,
        pill: "Cleaning now",
        title: `${name} is cleaning`,
        tone: GREEN,
      };
    case "awaiting_customer_confirmation":
      return {
        detail: "Have a look round and confirm the clean, or tell us if something isn't right.",
        live: false,
        pill: "Please review",
        title: `${name} has finished`,
        tone: AMBER,
      };
    case "completed":
      return {
        detail: "Thanks for booking with Mundoria. Your invoice is ready on this page.",
        live: false,
        pill: "Completed",
        title: "Clean complete",
        tone: GREEN,
      };
    case "cancelled":
      return {
        detail: booking.cancellation_reason ?? "This visit was cancelled.",
        live: false,
        pill: "Cancelled",
        title: "Visit cancelled",
        tone: GREY,
      };
    default:
      return {
        detail: "Our team is looking into this visit and will be in touch.",
        live: false,
        pill: "Under review",
        title: "We're on it",
        tone: RED,
      };
  }
}

const tileLabel = "m-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#524096]/70";

/**
 * The booking's status, in the dashboard's format: a striped banner naming
 * the stage, then grey tiles for where things stand and who is cleaning.
 */
export function VisitStatusCard({
  booking,
  cleanerVisible,
  holdAtLabel,
}: {
  booking: Booking;
  cleanerVisible: boolean;
  holdAtLabel: string | null;
}) {
  const cleaner = cleanerVisible ? booking.cleaner ?? null : null;
  const first = cleaner?.full_name.trim().split(/\s+/)[0] ?? null;
  const stage = stageFor(booking, first, holdAtLabel);
  const avatar = cleaner ? resolveAvatarUrl(cleaner.avatar_url, cleaner.id) : null;

  return (
    <section aria-live="polite" className="flex flex-col gap-4 rounded-[22px] bg-white p-4 sm:p-5">
      <SectionBanner title={stage.title} />

      <div className="rounded-[18px] bg-[#F3F4F6] p-4">
        <p className={tileLabel}>Status</p>
        <span className={`mt-2.5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[13px] font-semibold ${stage.tone}`}>
          {stage.live ? (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-50 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
            </span>
          ) : null}
          {stage.pill}
        </span>
        <p className="m-0 mt-2.5 text-[14.5px] leading-[1.5] text-[#3d3a48]">{stage.detail}</p>
      </div>

      {cleaner ? (
        <div className="rounded-[18px] bg-[#F3F4F6] p-4">
          <p className={tileLabel}>Your cleaner</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#ECE8F6] text-lg font-bold text-[#524096]">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={cleaner.full_name} className={avatarImageClass(avatar)} src={avatar} />
              ) : (
                cleaner.full_name.charAt(0)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-[16px] font-semibold text-[#1E1848]">{cleaner.full_name}</p>
              <p className="m-0 mt-1 flex items-center gap-1.5 text-[13px] text-[#5F5F66]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" aria-hidden className="h-4 w-4" src={medallionIconSrc(cleaner.tier)} />
                {cleanerTierLabel(cleaner.tier)} medallion
              </p>
            </div>
          </div>
          {booking.status !== "cancelled" ? (
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              <Link className={pillPrimary} href={`/messages/${booking.id}`} style={pillPrimaryStyle}>
                Message {first}
              </Link>
              {booking.status === "completed" ? (
                <Link className={pillOutline} href={`/booking/new?rebook=${booking.id}&keep=1`}>
                  Book {first} again
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
