"use client";

import type { ReactNode } from "react";
import { Clock, MapPin, ShoppingCart } from "@phosphor-icons/react";
import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { formatBookingDate } from "@/lib/customer/booking-flow";
import { formatHourlyRate, formatMoney } from "@/lib/customer/services";
import { cn } from "@/lib/utils";
import type { Address } from "@/types/customer";

type BasketProps = {
  addOns: { amount: number; hourly?: boolean; label: string }[];
  address: Address | null;
  alternateTimes?: string[];
  /** Visit total in pence (labour + add-ons) shown on the Cleaning row. */
  amount: number | null;
  bathrooms: number | null;
  bedrooms: number | null;
  customDates?: string[];
  durationHours: number | null;
  frequencyLabel: string | null;
  hasPets?: boolean | null;
  /** Optional; no longer shown on the Cleaning row (kept for callers). */
  hourlyRatePence?: number | null;
  priorityAreas?: string[];
  scheduledDate: string;
  scheduledTime: string;
  serviceLabel: string | null;
  standardLabel: string | null;
};

function formatDuration(hours: number) {
  const total = Math.round(hours * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (m === 0) return `${h}h`;
  if (m === 30) return `${h}h30`;
  return `${h}h${String(m).padStart(2, "0")}`;
}

function formatDay(date: string) {
  return formatBookingDate(date, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatWhen(date: string, time: string) {
  const day = formatDay(date);
  if (!day) return null;
  if (!time) return day;
  return `${day} at ${time.slice(0, 5)}`;
}

/** Prefer line1 when it already includes city/postcode (Geoapify formatted). */
function formatBasketAddress(address: Address) {
  const line1 = address.address_line_1.trim();
  const extras = [address.address_line_2, address.city, address.postcode]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .filter(
      (part) => !line1.toLowerCase().includes(part.toLowerCase()),
    );
  return [line1, ...extras].join(", ");
}

function BasketSection({
  children,
  filled = true,
  icon,
  open,
  onToggle,
  right,
  title,
}: {
  children?: ReactNode;
  /** When false, show a quiet placeholder row (no chevron). */
  filled?: boolean;
  icon: ReactNode;
  open: boolean;
  onToggle: () => void;
  right?: ReactNode;
  title: string;
}) {
  return (
    <div className="border-b border-[#e4daf5] last:border-b-0">
      <div className="flex w-full items-center gap-1 px-2 py-2 sm:px-3">
        {filled ? (
          <button
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-1.5 text-left touch-manipulation hover:bg-white/50"
            onClick={onToggle}
            type="button"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center text-[#6a45b8]">
              {icon}
            </span>
            <span className="min-w-0 flex-1 text-sm font-bold text-[#1c133b]">
              {title}
            </span>
            {right ? (
              <span className="shrink-0 text-[11px] font-normal tabular-nums text-[#5a5470]">
                {right}
              </span>
            ) : null}
          </button>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-3 px-2 py-1.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center text-[#b0a9bc]">
              {icon}
            </span>
            <span className="min-w-0 flex-1 text-sm font-semibold text-[#8a8498]">
              {title}
            </span>
            {right ? (
              <span className="shrink-0 text-[11px] font-normal tabular-nums text-[#8a8498]">
                {right}
              </span>
            ) : null}
          </div>
        )}
        {filled ? (
          <button
            aria-expanded={open}
            aria-label={open ? "Hide details" : "Show details"}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#8b8798] touch-manipulation hover:bg-white/50"
            onClick={onToggle}
            type="button"
          >
            <ChevronDown
              className={cn("h-4 w-4 transition", open && "rotate-180")}
            />
          </button>
        ) : null}
      </div>
      {filled && open && children ? (
        <div className="px-4 pb-4 pl-[3.25rem] text-sm font-bold text-[#1c133b]">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function BasketPanel({
  addOns,
  address,
  alternateTimes = [],
  amount,
  bathrooms,
  bedrooms,
  customDates = [],
  durationHours,
  frequencyLabel,
  hasPets = null,
  headerTitle = "My basket",
  priorityAreas = [],
  scheduledDate,
  scheduledTime,
  serviceLabel,
  standardLabel,
  showHeader = true,
}: BasketProps & { headerTitle?: string; showHeader?: boolean }) {
  const [open, setOpen] = useState({
    address: false,
    schedule: false,
    service: false,
  });
  const hasAnything = Boolean(address || serviceLabel || scheduledDate);
  const when = formatWhen(scheduledDate, scheduledTime);
  const scheduleDates =
    customDates.length > 0
      ? customDates
      : scheduledDate
        ? [scheduledDate]
        : [];

  if (!hasAnything) {
    return (
      <div className="overflow-hidden rounded-[1.25rem] border border-transparent bg-white shadow-[0_12px_32px_rgba(28,19,59,0.08)]">
        {showHeader ? (
          <p className="px-5 pt-5 text-center text-base font-bold text-[#1c133b]">
            {headerTitle}
          </p>
        ) : null}
        <div className="flex flex-col items-center px-6 pb-8 pt-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            className="h-28 w-28 bg-transparent object-contain"
            height={112}
            src="/images/booking/astronaut.png"
            width={112}
          />
          <p className="mt-4 text-base font-bold text-[#1c133b]">Welcome!</p>
          <p className="mt-1 text-sm leading-6 text-[#5a5470]">
            We can&apos;t wait to take care of your home.
          </p>
        </div>
      </div>
    );
  }

  const serviceLines: { key: string; label: string; price?: string }[] = [];
  if (serviceLabel) {
    serviceLines.push({ key: "service", label: serviceLabel });
  }
  if (frequencyLabel) {
    serviceLines.push({ key: "frequency", label: frequencyLabel });
  }
  if (durationHours != null) {
    serviceLines.push({
      key: "duration",
      label: `For ${formatDuration(durationHours)}`,
    });
  }
  if (standardLabel) {
    serviceLines.push({ key: "standard", label: standardLabel });
  }
  if (bedrooms != null || bathrooms != null) {
    const parts = [
      bedrooms != null ? `${bedrooms} bed` : null,
      bathrooms != null ? `${bathrooms} bath` : null,
    ].filter(Boolean);
    if (parts.length) {
      serviceLines.push({ key: "rooms", label: parts.join(" · ") });
    }
  }
  if (hasPets === true) {
    serviceLines.push({ key: "pets", label: "Pets present" });
  } else if (hasPets === false) {
    serviceLines.push({ key: "pets", label: "No pets" });
  }
  if (priorityAreas.length) {
    serviceLines.push({
      key: "priority",
      label: `Priority: ${priorityAreas.join(", ")}`,
    });
  }
  for (const addOn of addOns) {
    serviceLines.push({
      key: `addon-${addOn.label}`,
      label: addOn.label,
      price: addOn.hourly
        ? formatHourlyRate(addOn.amount)
        : addOn.amount <= 0
          ? undefined
          : formatMoney(addOn.amount),
    });
  }

  /** Cleaning header shows visit total (labour + add-ons), not the hourly rate. */
  const cleaningTotalLabel = amount != null ? formatMoney(amount) : null;

  const scheduleTitle =
    scheduleDates.length > 1
      ? `${scheduleDates.length} dates`
      : when ?? "Date of the session";

  const times = [
    scheduledTime,
    ...alternateTimes.filter((slot) => slot !== scheduledTime),
  ].filter(Boolean);

  const addressFilled = Boolean(address);
  const serviceFilled = Boolean(serviceLabel);
  const scheduleFilled = scheduleDates.length > 0 || times.length > 0;

  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-transparent bg-white shadow-[0_12px_32px_rgba(28,19,59,0.08)]">
      {showHeader ? (
        <div className="border-b border-[#e4daf5] px-5 py-4">
          <p className="text-center text-base font-bold text-[#1c133b]">
            {headerTitle}
          </p>
        </div>
      ) : null}

      <BasketSection
        filled={addressFilled}
        icon={<MapPin className="h-5 w-5" weight="fill" />}
        onToggle={() => setOpen((c) => ({ ...c, address: !c.address }))}
        open={open.address}
        title={address ? formatBasketAddress(address) : "Add your address"}
      >
        {null}
      </BasketSection>

      <BasketSection
        filled={serviceFilled || amount != null}
        icon={<ShoppingCart className="h-5 w-5" weight="fill" />}
        onToggle={() => setOpen((c) => ({ ...c, service: !c.service }))}
        open={open.service}
        right={cleaningTotalLabel ?? undefined}
        title="Cleaning"
      >
        {serviceLines.length ? (
          <ul className="space-y-1.5">
            {serviceLines.map((line) => (
              <li
                className="flex items-baseline justify-between gap-3"
                key={line.key}
              >
                <span>· {line.label}</span>
                {line.price ? (
                  <span className="shrink-0 text-[11px] font-normal tabular-nums text-[#5a5470]">
                    {line.price}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-semibold text-[#8a8498]">
            Choose your cleaning session.
          </p>
        )}
      </BasketSection>

      <BasketSection
        filled={scheduleFilled}
        icon={<Clock className="h-5 w-5" weight="fill" />}
        onToggle={() => setOpen((c) => ({ ...c, schedule: !c.schedule }))}
        open={open.schedule}
        title={scheduleTitle}
      >
        {scheduleDates.length || times.length ? (
          <ul className="space-y-1.5">
            {scheduleDates.length > 1 ? (
              <>
                {scheduleDates.map((date) => (
                  <li key={date}>· {formatDay(date)}</li>
                ))}
                {times.length ? (
                  <li>
                    · Times for all days:{" "}
                    {times.map((slot) => slot.slice(0, 5)).join(", ")}
                  </li>
                ) : null}
              </>
            ) : (
              <>
                <li>
                  · {when ?? formatDay(scheduleDates[0] ?? scheduledDate)}
                </li>
                {times.length > 1 ? (
                  <li>
                    · Also available:{" "}
                    {times
                      .slice(1)
                      .map((slot) => slot.slice(0, 5))
                      .join(", ")}
                  </li>
                ) : null}
              </>
            )}
          </ul>
        ) : (
          <p>Choose a date for your session.</p>
        )}
      </BasketSection>
    </div>
  );
}

/** Desktop sticky sidebar basket (hidden below lg). */
export function BookingBasket(props: BasketProps) {
  return (
    <aside className="hidden w-full lg:sticky lg:top-20 lg:block">
      <BasketPanel {...props} />
    </aside>
  );
}

/** Read-only basket-style summary — used on booking detail. */
export function BookingSummaryCard({
  title = "Booking details",
  ...props
}: BasketProps & { title?: string }) {
  return <BasketPanel {...props} headerTitle={title} />;
}

/** Mobile bottom sheet — WeCasa-style “My basket”. Closed via bar chevron. */
export function BookingBasketSheet({
  onClose,
  open,
  ...props
}: BasketProps & { onClose: () => void; open: boolean }) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previous?.focus?.();
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] top-0 z-[60] flex items-end justify-center bg-black/40 lg:hidden"
      role="dialog"
    >
      <button
        aria-label="Close basket"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <div
        className="relative flex max-h-[min(78dvh,34rem)] w-full flex-col overflow-hidden rounded-t-[1.25rem] bg-white outline-none"
        ref={panelRef}
        tabIndex={-1}
      >
        <div className="flex shrink-0 flex-col items-center px-4 pb-4 pt-2">
          <button
            aria-label="Close basket"
            className="inline-flex h-11 w-14 items-center justify-center rounded-full text-[#1c133b] touch-manipulation hover:bg-[#f3f3f5]"
            onClick={onClose}
            type="button"
          >
            <ChevronDown className="h-6 w-6" strokeWidth={2.5} />
          </button>
          <h2
            className="mt-1 text-base font-bold text-[#1c133b]"
            id={titleId}
          >
            My basket
          </h2>
        </div>
        <div className="overflow-y-auto overscroll-contain border-t border-[#e8e8eb] px-3 pb-3 pt-3">
          <BasketPanel {...props} showHeader={false} />
        </div>
      </div>
    </div>
  );
}
