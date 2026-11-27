import Link from "next/link";

import { avatarImageClass, resolveAvatarUrl } from "@/lib/avatars/default-pack";
import { cleanerTierLabel, medallionIconSrc } from "@/lib/cleaner/tier";
import type { Booking } from "@/types/customer";

type Stage = {
  /** Background of the card: navy for live stages, purple for planned ones. */
  bg: string;
  detail: string;
  /** Show the pulsing dot for stages that are happening right now. */
  live: boolean;
  pill: string;
  pillTone: string;
  title: string;
};

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

const NAVY = "#1E1848";
const PURPLE = "linear-gradient(135deg,#7F71B1 0%,#524096 100%)";

/** Where the visit is now, in words the customer can act on. */
function stageFor(booking: Booking, cleanerFirst: string | null, holdAtLabel: string | null): Stage {
  const when = `${dayLabel(booking.scheduled_date)} at ${clock(booking.scheduled_start_time)}`;
  const name = cleanerFirst ?? "Your cleaner";
  switch (booking.status) {
    case "pending_match":
    case "matched":
      return {
        bg: PURPLE,
        detail: "We're finding the right cleaner for you. We'll email you as soon as they're confirmed.",
        live: false,
        pill: "Finding your cleaner",
        pillTone: "bg-[#FFF1DB] text-[#8A5200]",
        title: "Arranging your clean",
      };
    case "awaiting_payment":
      return {
        bg: PURPLE,
        detail: holdAtLabel
          ? `We'll confirm your visit when we place the card hold on ${holdAtLabel}. Nothing to do.`
          : "We're placing the card hold now to confirm your visit.",
        live: false,
        pill: "Cleaner accepted",
        pillTone: "bg-white/20 text-white",
        title: `${name} has accepted`,
      };
    case "confirmed":
      return {
        bg: PURPLE,
        detail: `${name} will arrive ${when}.`,
        live: false,
        pill: "Confirmed",
        pillTone: "bg-[#E3F5EA] text-[#13693A]",
        title: "You're all set",
      };
    case "cleaner_en_route":
      return booking.arrived_at
        ? {
            bg: NAVY,
            detail: `${name} has arrived and is getting ready to start.`,
            live: true,
            pill: "Arrived",
            pillTone: "bg-[#E3F5EA] text-[#13693A]",
            title: `${name} is at your door`,
          }
        : {
            bg: NAVY,
            detail: "You'll see them on the map below as they travel.",
            live: true,
            pill: "On the way",
            pillTone: "bg-[#FFC9A3] text-[#1C133B]",
            title: `${name} is on the way`,
          };
    case "in_progress":
      return {
        bg: NAVY,
        detail: `Booked until ${endTime(booking.scheduled_start_time, booking.estimated_duration_hours)}. The countdown above shows the time left.`,
        live: true,
        pill: "Cleaning now",
        pillTone: "bg-[#E3F5EA] text-[#13693A]",
        title: `${name} is cleaning`,
      };
    case "awaiting_customer_confirmation":
      return {
        bg: NAVY,
        detail: "Have a look round and confirm the clean, or tell us if something isn't right.",
        live: false,
        pill: "Please review",
        pillTone: "bg-[#FFC9A3] text-[#1C133B]",
        title: `${name} has finished`,
      };
    case "completed":
      return {
        bg: PURPLE,
        detail: "Thanks for booking with Mundoria. Your invoice is ready below.",
        live: false,
        pill: "Completed",
        pillTone: "bg-[#E3F5EA] text-[#13693A]",
        title: "Clean complete",
      };
    case "cancelled":
      return {
        bg: "linear-gradient(135deg,#6B6680 0%,#4A4560 100%)",
        detail: booking.cancellation_reason ?? "This visit was cancelled.",
        live: false,
        pill: "Cancelled",
        pillTone: "bg-white/20 text-white",
        title: "Visit cancelled",
      };
    default:
      return {
        bg: NAVY,
        detail: "Our team is looking into this visit and will be in touch.",
        live: false,
        pill: "Under review",
        pillTone: "bg-[#FFE6E1] text-[#9A2B18]",
        title: "We're on it",
      };
  }
}

/**
 * The booking's status card: what's happening now, and who is cleaning.
 * Replaces the plain "Your cleaner" box.
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
    <section
      aria-live="polite"
      className="relative overflow-hidden rounded-[22px] p-5 text-white"
      style={{ background: stage.bg }}
    >
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern height="22" id="visit-dots" patternUnits="userSpaceOnUse" width="22">
            <circle cx="1.5" cy="1.5" fill="rgba(255,255,255,0.07)" r="1.5" />
          </pattern>
        </defs>
        <rect fill="url(#visit-dots)" height="100%" width="100%" />
      </svg>

      <div className="relative">
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12.5px] font-semibold ${stage.pillTone}`}>
          {stage.live ? (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
            </span>
          ) : null}
          {stage.pill}
        </span>
        <h2 className="m-0 mt-3 text-[21px] font-bold leading-tight tracking-[-0.01em]">{stage.title}</h2>
        <p className="m-0 mt-1.5 text-[14px] leading-[1.5] text-white/80">{stage.detail}</p>

        {cleaner ? (
          <div className="mt-4 flex items-center gap-3 rounded-[14px] bg-white/10 p-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 text-lg font-bold">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={cleaner.full_name} className={avatarImageClass(avatar)} src={avatar} />
              ) : (
                cleaner.full_name.charAt(0)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-[15px] font-semibold">{cleaner.full_name}</p>
              <p className="m-0 mt-1 flex items-center gap-1.5 text-[12.5px] text-white/75">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" aria-hidden className="h-4 w-4" src={medallionIconSrc(cleaner.tier)} />
                {cleanerTierLabel(cleaner.tier)} medallion
              </p>
            </div>
          </div>
        ) : null}

        {cleaner && booking.status !== "cancelled" ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-4 text-[14px] font-semibold text-[#524096] transition hover:bg-[#ECE8F6]"
              href={`/messages/${booking.id}`}
            >
              Message {first}
            </Link>
            {booking.status === "completed" ? (
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-white/50 px-4 text-[14px] font-semibold text-white transition hover:bg-white/10"
                href={`/booking/new?rebook=${booking.id}&keep=1`}
              >
                Book {first} again
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
