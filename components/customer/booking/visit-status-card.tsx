import Link from "next/link";

import { SectionHeading } from "@/components/customer/dashboard/section-banner";
import { avatarImageClass, resolveAvatarUrl } from "@/lib/avatars/default-pack";
import {
  cleanerTierLabel,
  normalizeMedallionTier,
} from "@/lib/cleaner/tier";
import type { CleanerTier } from "@/types/cleaner";
import type { Booking } from "@/types/customer";

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

function MedallionAvatar({
  avatarUrl,
  name,
  tier,
}: {
  avatarUrl: string | null;
  name: string;
  tier: CleanerTier;
}) {
  const visual = normalizeMedallionTier(tier) as keyof typeof MEDALLION_RING;
  const ring = MEDALLION_RING[visual] ?? MEDALLION_RING.silver;
  const label = cleanerTierLabel(tier);

  return (
    <div
      className="relative h-[64px] w-[64px] shrink-0"
      title={`${label} medallion`}
    >
      {/* Outer metal band */}
      <div
        className="absolute inset-0 rounded-full p-[3px]"
        style={{
          background: `linear-gradient(160deg, ${ring.light} 0%, ${ring.mid} 38%, ${ring.dark} 72%, ${ring.light} 100%)`,
          boxShadow: `0 2px 6px ${ring.dark}40, inset 0 1px 0 ${ring.light}`,
        }}
      >
        {/* Inner highlight band */}
        <div
          className="h-full w-full rounded-full p-[4px]"
          style={{
            background: `linear-gradient(320deg, ${ring.dark} 0%, ${ring.light} 45%, ${ring.mid} 100%)`,
          }}
        >
          <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white text-[16px] font-bold text-[#524096] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.9)]">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={name} className={avatarImageClass(avatarUrl)} src={avatarUrl} />
            ) : (
              name.charAt(0)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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
            pill: "En route",
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

/**
 * Visit stage + cleaner in one panel — status, person, and actions
 * share one surface so proportions stay even.
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
  const tierLabel = cleaner ? cleanerTierLabel(cleaner.tier) : null;

  return (
    <section aria-live="polite" className="flex flex-col gap-4 rounded-[22px] bg-white p-4 sm:p-5">
      <SectionHeading title={stage.title} />

      <div className="rounded-[18px] bg-[#F3F4F6] p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="m-0 text-[14.5px] leading-[1.5] text-[#3d3a48]">{stage.detail}</p>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-semibold ${stage.tone}`}
          >
            {stage.live ? (
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-50 motion-reduce:animate-none" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
              </span>
            ) : null}
            {stage.pill}
          </span>
        </div>

        {cleaner ? (
          <>
            <div className="my-4 h-px bg-[#E4E3EA]" />

            <div className="flex items-center gap-3.5">
              <MedallionAvatar
                avatarUrl={avatar}
                name={cleaner.full_name}
                tier={cleaner.tier}
              />

              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-[15px] font-semibold text-[#1E1848]">
                  {cleaner.full_name}
                </p>
                <p className="m-0 mt-0.5 text-[13px] text-[#6B6B70]">
                  {tierLabel} medallion
                </p>
              </div>

              {booking.status !== "cancelled" ? (
                <Link
                  className="inline-flex h-9 shrink-0 items-center rounded-full border border-[#D4CCEA] bg-white px-3.5 text-[13px] font-semibold text-[#524096] no-underline transition hover:bg-[#ECE8F6]"
                  href={`/messages/${booking.id}`}
                >
                  Message
                </Link>
              ) : null}
            </div>

            {booking.status === "completed" ? (
              <Link
                className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-full border border-[#D4CCEA] bg-white text-[13px] font-semibold text-[#524096] no-underline transition hover:bg-[#ECE8F6]"
                href={`/booking/new?rebook=${booking.id}&keep=1`}
              >
                Book {first} again
              </Link>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
