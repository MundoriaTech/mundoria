"use client";

import {
  CalendarDays,
  Check,
  ChevronDown,
  FileBadge,
  FileUp,
  Info,
  Search,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { FieldError, invalidControlClass } from "@/components/shared/action-error";
import { cn } from "@/lib/utils";

type OnboardingSelectOption = {
  flag?: string;
  label: string;
  value: string;
};

/** Custom dropdown — floating label chrome, optional search for long lists. */
export function OnboardingSelect({
  error,
  label,
  onChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  value,
}: {
  error?: string;
  /** When set, uses floating-label field chrome like other onboarding inputs. */
  label?: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<OnboardingSelectOption>;
  placeholder?: string;
  searchPlaceholder?: string;
  value: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = options.find((option) => option.value === value);
  const searchable = options.length > 10;
  const normalisedQuery = query.trim().toLowerCase();
  const filtered = normalisedQuery
    ? options.filter(
        (option) =>
          option.label.toLowerCase().includes(normalisedQuery) ||
          option.value.toLowerCase().includes(normalisedQuery),
      )
    : options;
  const empty = !selected;
  const floating = Boolean(label);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    window.requestAnimationFrame(() => searchRef.current?.focus());
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function OptionLabel({
    flag,
    text,
  }: {
    flag?: string;
    text: string;
  }) {
    return (
      <span className="inline-flex min-w-0 items-center gap-2">
        {flag ? (
          <span aria-hidden className="text-base leading-none">
            {flag}
          </span>
        ) : null}
        <span className="truncate">{text}</span>
      </span>
    );
  }

  return (
    <div className="space-y-1.5" ref={rootRef}>
      <div className="relative">
        <button
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn(
            "flex w-full items-center justify-between gap-3 rounded-xl border-2 border-[#1c133b] bg-transparent px-3.5 text-left text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[#1c133b]",
            floating ? "relative h-11" : "h-11",
            error && "border-[#d4694a] focus-visible:ring-[#d4694a]",
            open && "ring-2 ring-[#1c133b]",
            error && invalidControlClass,
          )}
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          {floating ? (
            <>
              <span
                className={cn(
                  "pointer-events-none absolute left-3.5 right-10 origin-left transition-all duration-150",
                  empty && !open
                    ? "top-1/2 -translate-y-1/2 text-[15px] font-normal text-[#8b8798]"
                    : "top-1.5 translate-y-0 text-[11px] font-semibold leading-none text-[#5a5470]",
                  open && "text-[#1c133b]",
                  error && "text-[#d4694a]",
                )}
              >
                {label}
              </span>
              <span className="block flex-1 pb-1 pr-8 pt-3.5">
                <span
                  className={cn(
                    "flex h-6 items-center text-[15px] font-medium text-[#1c133b]",
                    empty && "text-transparent",
                  )}
                >
                  <OptionLabel
                    flag={selected?.flag}
                    text={selected?.label ?? placeholder}
                  />
                </span>
              </span>
            </>
          ) : (
            <span
              className={cn(
                selected ? "font-medium text-[#1c133b]" : "text-[#8b8798]",
              )}
            >
              <OptionLabel
                flag={selected?.flag}
                text={selected?.label ?? placeholder}
              />
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-[#1c133b] transition",
              floating && "absolute right-3.5 top-1/2 -translate-y-1/2",
              open && "rotate-180",
            )}
            strokeWidth={2.5}
          />
        </button>

        {open ? (
          <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border-2 border-[#1c133b] bg-[#f9f6ef] shadow-[0_18px_40px_rgba(28,19,59,0.14)]">
            {searchable ? (
              <div className="flex items-center gap-2 border-b border-[#e8e0d0] px-3 py-2">
                <Search
                  className="h-4 w-4 shrink-0 text-[#8b8798]"
                  strokeWidth={2.5}
                />
                <input
                  className="h-9 w-full bg-transparent text-sm text-[#1c133b] outline-none placeholder:text-[#8b8798]"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={searchPlaceholder}
                  ref={searchRef}
                  type="search"
                  value={query}
                />
              </div>
            ) : null}
            <ul className="max-h-56 overflow-auto p-1.5" role="listbox">
              {filtered.length === 0 ? (
                <li className="px-3 py-2.5 text-sm text-[#8b8798]">
                  No matches.
                </li>
              ) : (
                filtered.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <li key={option.value}>
                      <button
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition",
                          isSelected
                            ? "bg-[#1c133b] text-white"
                            : "text-[#1c133b] hover:bg-[#1c133b] hover:text-white",
                        )}
                        onClick={() => {
                          onChange(option.value);
                          setOpen(false);
                        }}
                        role="option"
                        type="button"
                      >
                        <OptionLabel flag={option.flag} text={option.label} />
                        {isSelected ? (
                          <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                        ) : null}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        ) : null}
      </div>
      {error ? <FieldError message={error} /> : null}
    </div>
  );
}

function toIsoDate(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatIsoDateEnGb(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Floating-label date field with a custom Mundoria calendar (no native picker). */
export function OnboardingDateField({
  error,
  id,
  label,
  maxDate,
  minDate,
  onChange,
  value,
}: {
  error?: string;
  id?: string;
  label: string;
  /** YYYY-MM-DD inclusive upper bound. */
  maxDate?: string;
  /** YYYY-MM-DD inclusive lower bound. */
  minDate?: string;
  onChange: (next: string) => void;
  /** YYYY-MM-DD */
  value: string;
}) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const latest = maxDate ?? today;
  const earliest = minDate ?? "1990-01-01";
  const [viewMonth, setViewMonth] = useState(() =>
    value
      ? new Date(`${value}T12:00:00`)
      : new Date(`${latest}T12:00:00`),
  );

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
    setViewMonth(new Date(`${value}T12:00:00`));
  }, [value]);

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
  const display = formatIsoDateEnGb(value);
  const empty = !display;

  function shiftMonth(delta: number) {
    const next = new Date(year, month + delta, 1);
    const monthStart = toIsoDate(next.getFullYear(), next.getMonth(), 1);
    const monthEnd = toIsoDate(
      next.getFullYear(),
      next.getMonth(),
      new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate(),
    );
    if (monthEnd < earliest) return;
    if (monthStart > latest) return;
    setViewMonth(next);
  }

  function pickDay(day: number) {
    const iso = toIsoDate(year, month, day);
    if (iso < earliest || iso > latest) return;
    onChange(iso);
    setOpen(false);
  }

  return (
    <div className="space-y-1.5" ref={rootRef}>
      <div className="relative">
        <button
          aria-expanded={open}
          aria-haspopup="dialog"
          className={cn(
            "group/field relative h-11 w-full rounded-xl border-2 border-[#1c133b] bg-transparent px-3.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c133b]",
            error && "border-[#d4694a] focus-visible:ring-[#d4694a]",
            open && "ring-2 ring-[#1c133b]",
          )}
          id={fieldId}
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          <span
            className={cn(
              "pointer-events-none absolute left-3.5 right-10 origin-left transition-all duration-150",
              empty && !open
                ? "top-1/2 -translate-y-1/2 text-[15px] font-normal text-[#8b8798]"
                : "top-1.5 translate-y-0 text-[11px] font-semibold leading-none text-[#5a5470]",
              open && "text-[#1c133b]",
              error && "text-[#d4694a]",
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
        </button>

        {open ? (
          <div
            className="absolute right-0 z-30 mt-1.5 w-[15rem] rounded-xl border-2 border-[#1c133b] bg-[#f9f6ef] p-2 shadow-[0_12px_28px_rgba(28,19,59,0.12)]"
            role="dialog"
          >
            <div className="mb-1.5 flex items-center justify-between gap-1">
              <button
                aria-label="Previous month"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#1c133b]/35 text-base leading-none text-[#1c133b] transition hover:border-[#1c133b] touch-manipulation"
                onClick={() => shiftMonth(-1)}
                type="button"
              >
                ‹
              </button>
              <p className="text-xs font-semibold text-[#1c133b]">{monthLabel}</p>
              <button
                aria-label="Next month"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#1c133b]/35 text-base leading-none text-[#1c133b] transition hover:border-[#1c133b] touch-manipulation"
                onClick={() => shiftMonth(1)}
                type="button"
              >
                ›
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium text-[#8b8798]">
              {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="mt-0.5 grid grid-cols-7 gap-0.5 text-center text-xs">
              {cells.map((day, index) => {
                if (!day) return <span key={`e-${index}`} />;
                const iso = toIsoDate(year, month, day);
                const disabled = iso < earliest || iso > latest;
                const selected = value === iso;
                return (
                  <button
                    className={cn(
                      "mx-auto flex h-7 w-7 items-center justify-center rounded-full touch-manipulation transition",
                      selected
                        ? "bg-[#1c133b] font-semibold text-white"
                        : "text-[#1c133b] hover:bg-[#1c133b]/10",
                      disabled && "pointer-events-none opacity-30",
                    )}
                    disabled={disabled}
                    key={iso}
                    onClick={() => pickDay(day)}
                    type="button"
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
      {error ? <FieldError message={error} /> : null}
    </div>
  );
}

const ONBOARDING_PAGE_BG = "bg-[#f9f6ef]";

export function OnboardingCheckbox({
  checked,
  className,
  onCheckedChange,
}: {
  checked: boolean;
  className?: string;
  onCheckedChange: (next: boolean) => void;
}) {
  return (
    <>
      <input
        checked={checked}
        className="sr-only"
        onChange={(event) => onCheckedChange(event.target.checked)}
        type="checkbox"
      />
      <span
        aria-hidden
        className={cn(
          "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[#1c133b] transition",
          checked ? "bg-[#1c133b] text-white" : "bg-transparent",
          className,
        )}
      >
        {checked ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
      </span>
    </>
  );
}

export function BranchChoice({
  columns = 1,
  options,
  value,
  onChange,
}: {
  columns?: 1 | 2;
  options: { description?: string; label: string; value: string }[];
  value: string | null;
  onChange: (next: string) => void;
}) {
  return (
    <div
      className={cn(
        "grid gap-3",
        columns === 2 && "md:grid-cols-2",
      )}
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            className={cn(
              "rounded-2xl border-2 bg-[#f9f6ef] p-4 text-left transition touch-manipulation",
              active
                ? "border-[#1c133b] bg-white"
                : "border-[#1c133b]/35 hover:border-[#1c133b]",
            )}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            <p className="font-semibold text-[#1c133b]">{option.label}</p>
            {option.description ? (
              <p className="mt-1 text-sm leading-5 text-[#5a5470]">
                {option.description}
              </p>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Connected decision strip for Yes / No (and short ternary) choices.
 * Prefer this over pills or cards when the answer is a clear decision.
 */
export function DecisionStrip({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: { hint?: string; label: string; value: string }[];
  value: string | null;
  onChange: (next: string) => void;
}) {
  const selected = options.find((option) => option.value === value) ?? null;

  return (
    <div className="space-y-2">
      <div
        aria-label={label}
        className="flex overflow-hidden rounded-full border-2 border-[#1c133b]"
        role="radiogroup"
      >
        {options.map((option, index) => {
          const active = value === option.value;
          return (
            <button
              aria-checked={active}
              className={cn(
                "min-w-0 flex-1 px-3 py-2.5 text-center text-xs font-semibold transition touch-manipulation",
                index > 0 && "border-l-2 border-[#1c133b]",
                active
                  ? "bg-[#1c133b] text-white"
                  : "bg-[#f9f6ef] text-[#1c133b] hover:bg-white",
              )}
              key={option.value}
              onClick={() => onChange(option.value)}
              role="radio"
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {selected?.hint ? (
        <p className="text-sm leading-5 text-[#5a5470]">{selected.hint}</p>
      ) : null}
    </div>
  );
}

/** Soft pill single-select — lighter than BranchChoice cards. */
export function ChoicePills({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: { label: string; value: string }[];
  value: string | null;
  onChange: (next: string) => void;
}) {
  return (
    <div
      aria-label={label}
      className="flex flex-wrap gap-2"
      role="radiogroup"
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            aria-checked={active}
            className={cn(
              "rounded-full border-2 px-3.5 py-1.5 text-xs font-semibold transition touch-manipulation",
              active
                ? "border-[#1c133b] bg-[#1c133b] text-white"
                : "border-[#1c133b]/40 bg-transparent text-[#1c133b] hover:border-[#1c133b]",
            )}
            key={option.value}
            onClick={() => onChange(option.value)}
            role="radio"
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Soft pill multi-select — toggle every option that applies. */
export function ChoiceMultiPills({
  label,
  options,
  values,
  onChange,
}: {
  label?: string;
  options: { label: string; value: string }[];
  values: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(next: string) {
    onChange(
      values.includes(next)
        ? values.filter((item) => item !== next)
        : [...values, next],
    );
  }

  return (
    <div
      aria-label={label}
      className="flex flex-wrap gap-2"
      role="group"
    >
      {options.map((option) => {
        const active = values.includes(option.value);
        return (
          <button
            aria-pressed={active}
            className={cn(
              "rounded-full border-2 px-3.5 py-1.5 text-xs font-semibold transition touch-manipulation",
              active
                ? "border-[#1c133b] bg-[#1c133b] text-white"
                : "border-[#1c133b]/40 bg-transparent text-[#1c133b] hover:border-[#1c133b]",
            )}
            key={option.value}
            onClick={() => toggle(option.value)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Same card style as BranchChoice, but toggles multiple values. */
export function BranchMultiChoice({
  columns = 1,
  options,
  values,
  onChange,
}: {
  columns?: 1 | 2;
  options: { description?: string; label: string; value: string }[];
  values: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(value: string) {
    onChange(
      values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value],
    );
  }

  return (
    <div
      className={cn(
        "grid gap-3",
        columns === 2 && "md:grid-cols-2",
      )}
    >
      {options.map((option) => {
        const active = values.includes(option.value);
        return (
          <button
            aria-pressed={active}
            className={cn(
              "rounded-2xl border-2 bg-[#f9f6ef] p-4 text-left transition touch-manipulation",
              active
                ? "border-[#1c133b] bg-white"
                : "border-[#1c133b]/35 hover:border-[#1c133b]",
            )}
            key={option.value}
            onClick={() => toggle(option.value)}
            type="button"
          >
            <p className="font-semibold text-[#1c133b]">{option.label}</p>
            {option.description ? (
              <p className="mt-1 text-sm leading-5 text-[#5a5470]">
                {option.description}
              </p>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function FaqAccordion({
  items,
}: {
  items: readonly { a: string; q: string }[];
}) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="mt-10 space-y-2">
      <h3 className="text-base font-bold text-[#1c133b]">
        Frequently asked questions
      </h3>
      <ul className="divide-y divide-[#e8e0d0] rounded-2xl border-2 border-[#1c133b] bg-[#f9f6ef]">
        {items.map((item) => {
          const expanded = open === item.q;
          return (
            <li key={item.q}>
              <button
                aria-expanded={expanded}
                className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left touch-manipulation"
                onClick={() => setOpen(expanded ? null : item.q)}
                type="button"
              >
                <span className="text-sm font-semibold text-[#1c133b]">
                  {item.q}
                </span>
                <ChevronDown
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0 text-[#1c133b] transition",
                    expanded && "rotate-180",
                  )}
                />
              </button>
              {expanded ? (
                <p className="px-4 pb-3.5 text-sm leading-6 text-[#5a5470]">
                  {item.a}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function InfoCallout({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 flex gap-2.5 text-sm leading-6 text-[#3b3358]">
      <Info
        aria-hidden
        className="mt-0.5 h-4 w-4 shrink-0 text-[#1c133b]"
        strokeWidth={2.25}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function ExternalCta({
  href,
  label,
  secondary,
}: {
  href: string;
  label: string;
  secondary?: boolean;
}) {
  return (
    <a
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-[#1c133b] px-5 text-sm font-semibold touch-manipulation",
        secondary
          ? "bg-[#f9f6ef] text-[#1c133b] hover:bg-[#1c133b] hover:text-white"
          : "bg-[#1c133b] text-white hover:bg-[#312c79]",
      )}
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {label}
    </a>
  );
}

/** In-flow secondary action (e.g. “I’ll do this later”). */
export function SoftDeferButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-[#1c133b] bg-[#f9f6ef] px-5 text-sm font-semibold text-[#1c133b] touch-manipulation hover:bg-[#1c133b] hover:text-white"
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

export function SuccessBanner({ children }: { children: ReactNode }) {
  return (
    <div
      aria-live="polite"
      className="rounded-2xl border-2 border-emerald-700/30 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
    >
      {children}
    </div>
  );
}

export function ChipMultiSelect({
  options,
  selected,
  onChange,
}: {
  options: readonly string[] | readonly { label: string; value: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const value = typeof option === "string" ? option : option.value;
        const label = typeof option === "string" ? option : option.label;
        const active = selected.includes(value);
        return (
          <button
            className={cn(
              "rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition touch-manipulation",
              active
                ? "border-[#1c133b] bg-[#1c133b] text-white"
                : "border-[#1c133b] bg-[#f9f6ef] text-[#1c133b]",
            )}
            key={value}
            onClick={() => toggle(value)}
            type="button"
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function DocumentUpload({
  accept = ".pdf,image/*",
  error,
  label,
  onFile,
  onRemove,
  previewIsPdf = false,
  previewUrl,
  progress,
  uploaded,
  uploading = false,
}: {
  accept?: string;
  error?: string;
  label: string;
  onFile: (file: File) => void;
  onRemove?: () => void;
  previewIsPdf?: boolean;
  previewUrl?: string;
  progress?: number;
  uploaded: boolean;
  uploading?: boolean;
}) {
  const imageOnly = accept.includes("image") && !accept.includes("pdf");
  const looksLikePdf = Boolean(previewUrl) && previewIsPdf;
  const showImagePreview = Boolean(previewUrl) && !looksLikePdf;
  const percent =
    typeof progress === "number"
      ? Math.max(0, Math.min(100, Math.round(progress)))
      : null;

  return (
    <div className="mx-auto w-full max-w-sm space-y-3">
      <p className="text-sm font-medium text-[#291845]">{label}</p>
      {showImagePreview || looksLikePdf || uploading || uploaded ? (
        <div className="relative pt-3">
          {!uploading && (uploaded || previewUrl) && onRemove ? (
            <button
              aria-label={`Remove ${label}`}
              className="absolute right-2 top-0 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#d4694a] bg-[#fff4ee] text-[#d4694a] shadow-sm transition hover:bg-[#d4694a] hover:text-white"
              onClick={onRemove}
              type="button"
            >
              <X className="h-4 w-4" strokeWidth={2.75} />
            </button>
          ) : null}
          <div className="overflow-hidden rounded-2xl border border-[#e5e1ea] bg-[#faf8ff]">
            <div className="relative flex h-48 items-center justify-center overflow-hidden bg-[#f3f0f8]">
              {showImagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element -- signed/blob preview URLs
                <img
                  alt={`${label} preview`}
                  className="h-full w-full object-contain"
                  src={previewUrl}
                />
              ) : looksLikePdf ? (
                <div className="flex flex-col items-center gap-3 px-6 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#efe8fa] text-[#6a45b8]">
                    <FileBadge className="h-6 w-6" strokeWidth={2} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#291845]">
                      PDF ready
                    </p>
                    <a
                      className="mt-1 inline-block text-sm font-medium text-[#6a45b8] hover:underline"
                      href={previewUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open preview
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 px-6 text-[#6a45b8]">
                  <span className="h-9 w-9 animate-spin rounded-full border-2 border-[#d8ccee] border-t-[#6a45b8]" />
                  <p className="text-sm font-medium">Preparing preview…</p>
                </div>
              )}
              {uploading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#291845]/55 backdrop-blur-[2px]">
                  <div className="relative flex h-16 w-16 items-center justify-center">
                    <span className="absolute inset-0 rounded-full border-2 border-white/25" />
                    <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-white" />
                    <span className="text-sm font-semibold tabular-nums text-white">
                      {percent ?? 0}%
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    Uploading… {percent ?? 0}%
                  </p>
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ebe6f2] bg-white px-4 py-3">
              <p className="text-sm font-medium text-[#291845]">
                {uploading
                  ? `Uploading… ${percent ?? 0}%`
                  : uploaded
                    ? "Uploaded"
                    : "Choose a file"}
              </p>
              <label className="inline-flex cursor-pointer items-center rounded-lg border border-[#e5e1ea] bg-white px-3 py-2 text-sm font-semibold text-[#291845] hover:bg-[#faf8ff]">
                {uploaded || previewUrl ? "Replace" : "Choose file"}
                <input
                  accept={accept}
                  className="hidden"
                  disabled={uploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onFile(file);
                    event.target.value = "";
                  }}
                  type="file"
                />
              </label>
            </div>
          </div>
        </div>
      ) : (
        <label
          className={cn(
            "flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed bg-[#f9f6ef] p-8 text-center transition",
            error
              ? "border-[#d4694a] hover:border-[#d4694a]"
              : "border-[#1c133b]/55 hover:border-[#1c133b]",
            uploading && "pointer-events-none opacity-70",
          )}
        >
          <FileUp className="h-8 w-8 text-[#1c133b]" strokeWidth={2.25} />
          <b className="mt-3 text-sm text-[#291845]">Choose file</b>
          <span className="mt-1 text-xs text-[#8b8798]">
            {imageOnly ? "JPEG, PNG or WebP" : "PDF, JPEG, PNG or WebP"}
          </span>
          <input
            accept={accept}
            className="hidden"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onFile(file);
              event.target.value = "";
            }}
            type="file"
          />
        </label>
      )}
      {error ? (
        <div>
          <FieldError message={error} />
        </div>
      ) : null}
    </div>
  );
}

export { ONBOARDING_PAGE_BG };
