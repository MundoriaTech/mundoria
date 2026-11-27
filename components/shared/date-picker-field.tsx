"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { FieldError } from "@/components/shared/action-error";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;
const MOBILE_MQ = "(max-width: 639px)";

function toIso(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function monthDateFromIso(iso: string) {
  const [year, month] = iso.split("-").map(Number);
  if (!year || !month) return new Date();
  return new Date(year, month - 1, 1, 12);
}

function todayIso() {
  const now = new Date();
  return toIso(now.getFullYear(), now.getMonth(), now.getDate());
}

function parseDatePart(value: string) {
  if (!value) return "";
  return value.slice(0, 10);
}

function parseTimePart(value: string) {
  const match = value.match(/T(\d{2}):(\d{2})/);
  if (!match) return { hour: "09", minute: "00" };
  return { hour: match[1], minute: match[2] };
}

function formatDisplayDate(iso: string) {
  if (!iso) return "";
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDisplayDateTime(value: string) {
  const date = parseDatePart(value);
  if (!date) return "";
  const { hour, minute } = parseTimePart(value);
  return `${formatDisplayDate(date)}, ${hour}:${minute}`;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(MOBILE_MQ);
    const sync = () => setMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return mobile;
}

function MonthGrid({
  max,
  min,
  onPick,
  selected,
  viewMonth,
  onViewMonthChange,
}: {
  max?: string;
  min?: string;
  onPick: (iso: string) => void;
  selected: string;
  viewMonth: Date;
  onViewMonthChange: (next: Date) => void;
}) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const monthLabel = viewMonth.toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
  });
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const floor = min ?? "";
  const ceiling = max ?? "";
  const viewStart = toIso(year, month, 1);
  const canGoPrev = !floor || viewStart > `${floor.slice(0, 7)}-01`;
  const canGoNext = !ceiling || viewStart < `${ceiling.slice(0, 7)}-01`;
  const canGoPrevYear = !floor || year - 1 >= Number(floor.slice(0, 4));
  const canGoNextYear = !ceiling || year + 1 <= Number(ceiling.slice(0, 4));

  function shiftMonth(delta: number) {
    let next = new Date(year, month + delta, 1, 12);
    if (Math.abs(delta) >= 12) {
      if (floor) {
        const earliestMonth = monthDateFromIso(`${floor.slice(0, 7)}-01`);
        if (next < earliestMonth) next = earliestMonth;
      }
      if (ceiling) {
        const latestMonth = monthDateFromIso(`${ceiling.slice(0, 7)}-01`);
        if (next > latestMonth) next = latestMonth;
      }
    }
    onViewMonthChange(next);
  }

  const navBtn =
    "inline-flex h-11 w-11 items-center justify-center rounded-full text-lg text-[#1E1848] transition touch-manipulation hover:bg-[#F3F4F6] disabled:opacity-30 sm:h-9 sm:w-9 sm:text-base";

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-0.5">
        <button
          aria-label="Previous year"
          className={navBtn}
          disabled={!canGoPrevYear}
          onClick={() => shiftMonth(-12)}
          type="button"
        >
          «
        </button>
        <button
          aria-label="Previous month"
          className={navBtn}
          disabled={!canGoPrev}
          onClick={() => shiftMonth(-1)}
          type="button"
        >
          ‹
        </button>
        <p className="m-0 min-w-0 flex-1 truncate text-center text-[15px] font-semibold text-[#1E1848] sm:text-[13px]">
          {monthLabel}
        </p>
        <button
          aria-label="Next month"
          className={navBtn}
          disabled={!canGoNext}
          onClick={() => shiftMonth(1)}
          type="button"
        >
          ›
        </button>
        <button
          aria-label="Next year"
          className={navBtn}
          disabled={!canGoNextYear}
          onClick={() => shiftMonth(12)}
          type="button"
        >
          »
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8A84A0]">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-7 gap-0.5 text-center text-[15px] sm:text-[13px]">
        {cells.map((day, index) => {
          if (!day) return <span key={`e-${index}`} />;
          const iso = toIso(year, month, day);
          const disabled =
            Boolean(floor && iso < floor) || Boolean(ceiling && iso > ceiling);
          const isSelected = selected === iso;
          const isToday = iso === todayIso();
          return (
            <button
              className={cn(
                "mx-auto flex h-11 w-11 items-center justify-center rounded-full text-[#1E1848] transition touch-manipulation sm:h-9 sm:w-9",
                isSelected && "bg-[#524096] font-semibold text-white",
                !isSelected && !disabled && "hover:bg-[#ECE8F6] active:bg-[#ECE8F6]",
                !isSelected && isToday && "ring-1 ring-[#524096]/40",
                disabled && "opacity-30",
              )}
              disabled={disabled}
              key={iso}
              onClick={() => onPick(iso)}
              type="button"
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function stepIndex(options: string[], current: string, delta: number) {
  const index = Math.max(0, options.indexOf(current));
  const next = (index + delta + options.length) % options.length;
  return options[next] ?? current;
}

function TimeStepper({
  label,
  onStep,
  value,
}: {
  label: string;
  onStep: (delta: number) => void;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        aria-label={`Decrease ${label}`}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#524096] ring-1 ring-[#E1E1EA] transition touch-manipulation hover:bg-[#ECE8F6] active:bg-[#EAE7F5]"
        onClick={() => onStep(-1)}
        type="button"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={2.4} />
      </button>
      <div className="min-w-[3.25rem] text-center">
        <p className="m-0 text-[22px] font-semibold leading-none tabular-nums text-[#1E1848]">
          {value}
        </p>
        <p className="m-0 mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8A84A0]">
          {label}
        </p>
      </div>
      <button
        aria-label={`Increase ${label}`}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#524096] ring-1 ring-[#E1E1EA] transition touch-manipulation hover:bg-[#ECE8F6] active:bg-[#EAE7F5]"
        onClick={() => onStep(1)}
        type="button"
      >
        <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
      </button>
    </div>
  );
}

function TimeRow({
  hour,
  minute,
  minuteStep = 5,
  onChange,
}: {
  hour: string;
  minute: string;
  minuteStep?: number;
  onChange: (hour: string, minute: string) => void;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => pad2(i));
  const minutes = Array.from(
    { length: Math.floor(60 / minuteStep) },
    (_, i) => pad2(i * minuteStep),
  );
  const safeMinute = minutes.includes(minute) ? minute : (minutes[0] ?? "00");

  return (
    <div className="mt-3 border-t border-[#EAE7F5] pt-3">
      <p className="m-0 mb-2 text-[12px] font-semibold text-[#5F5F66]">Time</p>
      <div className="flex items-center justify-center gap-2 rounded-[16px] bg-[#F3F4F6] px-2 py-2.5 sm:gap-3">
        <TimeStepper
          label="Hour"
          onStep={(delta) =>
            onChange(stepIndex(hours, hour, delta), safeMinute)
          }
          value={hour}
        />
        <span className="pb-4 text-[20px] font-semibold text-[#524096]">:</span>
        <TimeStepper
          label="Min"
          onStep={(delta) =>
            onChange(hour, stepIndex(minutes, safeMinute, delta))
          }
          value={safeMinute}
        />
      </div>
    </div>
  );
}

type SharedProps = {
  className?: string;
  disabled?: boolean;
  /** Validation message under the field (onboarding / forms). */
  error?: string;
  id?: string;
  /** Floating-label trigger chrome (onboarding). */
  label?: string;
  max?: string;
  min?: string;
  name?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  /** Compact trigger without full input chrome (admin filter pills). */
  bare?: boolean;
  triggerClassName?: string;
  style?: CSSProperties;
};

export function DatePickerField({
  bare,
  className,
  disabled,
  error,
  id,
  label,
  max,
  min,
  name,
  onChange,
  placeholder = "Pick a date",
  required,
  style,
  triggerClassName,
  value,
}: SharedProps & { value: string }) {
  return (
    <PickerShell
      bare={bare}
      className={className}
      disabled={disabled}
      display={value ? formatDisplayDate(value) : ""}
      error={error}
      id={id}
      label={label}
      max={max}
      min={min}
      name={name}
      placeholder={placeholder}
      required={required}
      style={style}
      triggerClassName={triggerClassName}
      value={value}
      onCommit={(next) => onChange(next)}
      mode="date"
    />
  );
}

export function DateTimePickerField({
  bare,
  className,
  disabled,
  error,
  id,
  label,
  max,
  min,
  minuteStep = 5,
  name,
  onChange,
  placeholder = "Pick date & time",
  required,
  style,
  triggerClassName,
  value,
}: SharedProps & { value: string; minuteStep?: number }) {
  return (
    <PickerShell
      bare={bare}
      className={className}
      disabled={disabled}
      display={value ? formatDisplayDateTime(value) : ""}
      error={error}
      id={id}
      label={label}
      max={max}
      min={min}
      minuteStep={minuteStep}
      name={name}
      placeholder={placeholder}
      required={required}
      style={style}
      triggerClassName={triggerClassName}
      value={value}
      onCommit={(next) => onChange(next)}
      mode="datetime"
    />
  );
}

function PickerShell({
  bare,
  className,
  disabled,
  display,
  error,
  id,
  label,
  max,
  min,
  minuteStep = 5,
  mode,
  name,
  onCommit,
  placeholder,
  required,
  style,
  triggerClassName,
  value,
}: Omit<SharedProps, "onChange"> & {
  display: string;
  mode: "date" | "datetime";
  minuteStep?: number;
  onCommit: (value: string) => void;
  value: string;
}) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  /** Desktop date-only: prefer above so the form does not scroll under the field. */
  const [placement, setPlacement] = useState<"above" | "below">("above");
  const datePart = parseDatePart(value);
  const timePart = parseTimePart(value);
  const [viewMonth, setViewMonth] = useState(() =>
    monthDateFromIso(datePart || min || todayIso()),
  );
  const empty = !display;
  const floating = Boolean(label) && !bare;
  // Date+time is too tall for an anchored popover — always use a sheet.
  const useSheet = mode === "datetime" || isMobile;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setViewMonth(monthDateFromIso(datePart || min || todayIso()));
  }, [open, datePart, min]);

  useEffect(() => {
    if (!open || useSheet) return;

    function updatePlacement() {
      const root = rootRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      const panelHeight = panelRef.current?.offsetHeight ?? 300;
      const gap = 8;
      const spaceAbove = rect.top - gap;
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      if (spaceAbove >= panelHeight || spaceAbove >= spaceBelow) {
        setPlacement("above");
      } else {
        setPlacement("below");
      }
    }

    updatePlacement();
    const frame = window.requestAnimationFrame(updatePlacement);
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [open, useSheet]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    if (useSheet) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      if (useSheet) document.body.style.overflow = previous;
    };
  }, [open, useSheet]);

  useEffect(() => {
    if (!open || useSheet) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, useSheet]);

  function pickDate(iso: string) {
    if (mode === "date") {
      onCommit(iso);
      setOpen(false);
      return;
    }
    const { hour, minute } = timePart;
    onCommit(`${iso}T${hour}:${minute}`);
  }

  function pickTime(hour: string, minute: string) {
    const date = datePart || todayIso();
    onCommit(`${date}T${hour}:${minute}`);
  }

  const maxDate = max ? parseDatePart(max) : undefined;
  const minDate = min ? parseDatePart(min) : undefined;

  const panelBody: ReactNode = (
    <>
      <MonthGrid
        max={maxDate}
        min={minDate}
        onPick={pickDate}
        onViewMonthChange={setViewMonth}
        selected={datePart}
        viewMonth={viewMonth}
      />
      {mode === "datetime" ? (
        <TimeRow
          hour={timePart.hour}
          minute={timePart.minute}
          minuteStep={minuteStep}
          onChange={pickTime}
        />
      ) : null}
      <div className="mt-3 flex items-center justify-between gap-2">
        {value ? (
          <button
            className="px-1 text-[12px] font-semibold text-[#524096] touch-manipulation hover:underline"
            onClick={() => {
              onCommit("");
              if (mode === "date") setOpen(false);
            }}
            type="button"
          >
            Clear
          </button>
        ) : (
          <span />
        )}
        {useSheet ? (
          <button
            className="rounded-full bg-[#524096] px-3 py-1 text-[12px] font-semibold text-white transition touch-manipulation hover:bg-[#43357f]"
            onClick={() => setOpen(false)}
            type="button"
          >
            Done
          </button>
        ) : null}
      </div>
    </>
  );

  const desktopPopover =
    open && !useSheet ? (
      <div
        className={cn(
          "absolute left-0 z-50 w-[min(100vw-2rem,20rem)] rounded-[18px] border border-[#EAE7F5] bg-white p-3 shadow-[0_12px_40px_rgba(30,24,72,0.14)]",
          placement === "above" ? "bottom-full mb-2" : "top-full mt-2",
        )}
        ref={panelRef}
        role="dialog"
      >
        {panelBody}
      </div>
    ) : null;

  const sheet =
    open && useSheet && mounted
      ? createPortal(
          <div className="fixed inset-0 z-[120]">
            <button
              aria-label="Close calendar"
              className="absolute inset-0 bg-[#1E1848]/40"
              onClick={() => setOpen(false)}
              type="button"
            />
            <div
              className="absolute inset-x-0 bottom-0 mx-auto max-h-[min(92dvh,40rem)] w-full max-w-md overflow-y-auto rounded-t-[22px] bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_40px_rgba(30,24,72,0.18)] sm:bottom-6 sm:max-h-[min(85dvh,36rem)] sm:rounded-[22px] sm:px-5 sm:pb-5"
              role="dialog"
            >
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#E1E1EA] sm:hidden" />
              <p className="m-0 mb-3 text-center text-[15px] font-semibold text-[#1E1848]">
                {mode === "datetime" ? "Date & time" : "Pick a date"}
              </p>
              {panelBody}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      className={cn(floating ? "space-y-1.5" : "relative", className)}
      ref={rootRef}
      style={style}
    >
      {name || required ? (
        <input
          aria-hidden
          className="pointer-events-none absolute h-0 w-0 opacity-0"
          name={name}
          readOnly
          required={required}
          tabIndex={-1}
          value={value}
        />
      ) : null}
      <div className={cn(floating && "relative")}>
        <button
          aria-expanded={open}
          aria-haspopup="dialog"
          className={cn(
            bare
              ? "inline-flex min-h-11 items-center gap-1.5 border-none bg-transparent text-left text-[14.5px] text-[#3D335F] outline-none touch-manipulation sm:min-h-0"
              : floating
                ? cn(
                    "group/field relative h-12 w-full rounded-xl border-2 border-[#1c133b] bg-transparent px-3.5 text-left transition touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c133b] sm:h-11",
                    error && "border-[#d4694a] focus-visible:ring-[#d4694a]",
                    open && "ring-2 ring-[#1c133b]",
                  )
                : "flex h-12 w-full items-center gap-2 rounded-md border border-[#e8e8eb] bg-[#f9f6ef] px-3 text-left text-sm text-[#1c133b] outline-none transition touch-manipulation focus-visible:ring-2 focus-visible:ring-[#524096]/40 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11",
            triggerClassName,
          )}
          disabled={disabled}
          id={fieldId}
          onClick={() => setOpen((prev) => !prev)}
          type="button"
        >
          {floating ? (
            <>
              <span
                className={cn(
                  "pointer-events-none absolute left-3.5 right-10 origin-left transition-all duration-150",
                  empty && !open
                    ? "top-1/2 -translate-y-1/2 text-[15px] font-normal text-[#6f6a82]"
                    : "top-1.5 translate-y-0 text-[11px] font-semibold leading-none text-[#5a5470]",
                  open && "text-[#1c133b]",
                  error && "text-[#a8482b]",
                )}
              >
                {label}
              </span>
              <span className="block pb-1 pr-8 pt-3.5">
                <span
                  className={cn(
                    "block h-6 truncate text-[15px] leading-6 text-[#1c133b]",
                    empty && "text-transparent",
                  )}
                >
                  {display || "Select date"}
                </span>
              </span>
              <CalendarDays
                aria-hidden
                className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1c133b]"
                strokeWidth={2.25}
              />
            </>
          ) : (
            <>
              {!bare ? (
                <CalendarDays
                  aria-hidden
                  className="h-4 w-4 shrink-0 text-[#524096]"
                  strokeWidth={1.8}
                />
              ) : null}
              <span
                className={cn(
                  "min-w-0 flex-1 truncate",
                  !display && "text-[#6f6a82]",
                )}
              >
                {display || placeholder}
              </span>
            </>
          )}
        </button>
        {desktopPopover}
      </div>
      {error ? <FieldError message={error} /> : null}
      {sheet}
    </div>
  );
}
