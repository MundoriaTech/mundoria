"use client";

import type { ReactNode } from "react";
import { Clock, MapPin, ShoppingCart } from "@phosphor-icons/react";
import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { formatMoney } from "@/lib/customer/services";
import { cn } from "@/lib/utils";
import type { Address } from "@/types/customer";

type BasketProps = {
  addOns: { amount: number; label: string }[];
  address: Address | null;
  alternateTimes?: string[];
  amount: number | null;
  bathrooms: number | null;
  bedrooms: number | null;
  customDates?: string[];
  durationHours: number | null;
  frequencyLabel: string | null;
  hasPets?: boolean | null;
  onJumpAddress?: () => void;
  onJumpSchedule?: () => void;
  onJumpService?: () => void;
  priorityAreas?: string[];
  priceIsIndicative?: boolean;
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
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatWhen(date: string, time: string) {
  if (!date) return null;
  const day = formatDay(date);
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
  icon,
  open,
  onEdit,
  onToggle,
  right,
  title,
}: {
  children?: ReactNode;
  icon: ReactNode;
  open: boolean;
  onEdit?: () => void;
  onToggle: () => void;
  right?: ReactNode;
  title: string;
}) {
  return (
    <div className="border-b border-[#e8e8eb] last:border-b-0">
      <div className="flex w-full items-center gap-1 px-2 py-2 sm:px-3">
        <button
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-1.5 text-left touch-manipulation hover:bg-white/60"
          onClick={() => {
            if (onEdit) onEdit();
            else onToggle();
          }}
          type="button"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center text-[#6a45b8]">
            {icon}
          </span>
          <span className="min-w-0 flex-1 text-sm font-semibold text-[#1c133b]">
            {title}
          </span>
          {right ? (
            <span className="shrink-0 text-sm font-semibold tabular-nums text-[#1c133b]">
              {right}
            </span>
          ) : null}
        </button>
        <button
          aria-expanded={open}
          aria-label={open ? "Hide details" : "Show details"}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#8b8798] touch-manipulation hover:bg-white/60"
          onClick={onToggle}
          type="button"
        >
          <ChevronDown
            className={cn("h-4 w-4 transition", open && "rotate-180")}
          />
        </button>
      </div>
      {open && children ? (
        <div className="px-4 pb-4 pl-[3.25rem] text-sm text-[#5a5470]">
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
  onJumpAddress,
  onJumpSchedule,
  onJumpService,
  priorityAreas = [],
  priceIsIndicative = false,
  scheduledDate,
  scheduledTime,
  serviceLabel,
  standardLabel,
  showHeader = true,
}: BasketProps & { showHeader?: boolean }) {
  const [open, setOpen] = useState({
    address: true,
    schedule: true,
    service: true,
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
      <div className="overflow-hidden rounded-[1.25rem] bg-[#f3f3f5]">
        {showHeader ? (
          <p className="px-5 pt-5 text-center text-base font-bold text-[#1c133b]">
            My basket
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

  const serviceLines: string[] = [];
  if (serviceLabel) serviceLines.push(serviceLabel);
  if (frequencyLabel) serviceLines.push(frequencyLabel);
  if (durationHours != null) {
    serviceLines.push(`For ${formatDuration(durationHours)}`);
  }
  if (standardLabel) serviceLines.push(standardLabel);
  if (bedrooms != null || bathrooms != null) {
    const parts = [
      bedrooms != null ? `${bedrooms} bed` : null,
      bathrooms != null ? `${bathrooms} bath` : null,
    ].filter(Boolean);
    if (parts.length) serviceLines.push(parts.join(" · "));
  }
  if (hasPets === true) serviceLines.push("Pets present");
  else if (hasPets === false) serviceLines.push("No pets");
  if (priorityAreas.length) {
    serviceLines.push(`Priority: ${priorityAreas.join(", ")}`);
  }
  for (const addOn of addOns) {
    serviceLines.push(`${addOn.label} ${formatMoney(addOn.amount)}`);
  }

  const scheduleTitle =
    scheduleDates.length > 1
      ? `${scheduleDates.length} dates`
      : when ?? "Date of the session";

  const times = [
    scheduledTime,
    ...alternateTimes.filter((slot) => slot !== scheduledTime),
  ].filter(Boolean);

  return (
    <div className="overflow-hidden rounded-[1.25rem] bg-[#f3f3f5]">
      {showHeader ? (
        <p className="border-b border-[#e8e8eb] px-5 py-4 text-center text-base font-bold text-[#1c133b]">
          My basket
        </p>
      ) : null}

      <BasketSection
        icon={<MapPin className="h-5 w-5" weight="fill" />}
        onEdit={onJumpAddress}
        onToggle={() => setOpen((c) => ({ ...c, address: !c.address }))}
        open={open.address}
        title={address ? formatBasketAddress(address) : "Add your address"}
      >
        {!address ? (
          <p>Enter where the clean will take place.</p>
        ) : null}
      </BasketSection>

      <BasketSection
        icon={<ShoppingCart className="h-5 w-5" weight="fill" />}
        onEdit={onJumpService}
        onToggle={() => setOpen((c) => ({ ...c, service: !c.service }))}
        open={open.service}
        right={
          amount != null
            ? `${priceIsIndicative ? "From " : ""}${formatMoney(amount)}`
            : undefined
        }
        title="Cleaning"
      >
        {serviceLines.length ? (
          <ul className="space-y-1.5">
            {serviceLines.map((line) => (
              <li key={line}>· {line}</li>
            ))}
          </ul>
        ) : (
          <p>Choose your cleaning session.</p>
        )}
        {amount != null ? (
          <div className="mt-3 border-t border-[#e8e8eb] pt-3">
            <div className="flex items-center justify-between text-[#1c133b]">
              <span className="font-semibold">
                {priceIsIndicative ? "From" : "Total"}
              </span>
              <span className="text-lg font-bold tabular-nums">
                {formatMoney(amount)}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#8b8798]">
              {priceIsIndicative
                ? "Starting price — updates as you add details"
                : "Service fee included"}
            </p>
          </div>
        ) : null}
      </BasketSection>

      <BasketSection
        icon={<Clock className="h-5 w-5" weight="fill" />}
        onEdit={onJumpSchedule}
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
