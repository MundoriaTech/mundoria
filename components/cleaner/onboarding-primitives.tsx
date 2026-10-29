"use client";

import {
  CalendarDays,
  Check,
  ChevronDown,
  FileUp,
  Info,
  Search,
  X,
} from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";

import { motion } from "motion/react";

import { FieldError, invalidControlClass } from "@/components/shared/action-error";
import { SPRING } from "@/lib/motion";
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
            "flex w-full items-center justify-between gap-3 rounded-xl border-2 border-brand-ink bg-transparent px-3.5 text-left text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-brand-ink",
            floating ? "relative h-11" : "h-11",
            error && "border-brand-terracotta focus-visible:ring-brand-terracotta",
            open && "ring-2 ring-brand-ink",
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
                    ? "top-1/2 -translate-y-1/2 text-[15px] font-normal text-brand-subtle"
                    : "top-1.5 translate-y-0 text-[11px] font-semibold leading-none text-brand-muted",
                  open && "text-brand-ink",
                  error && "text-brand-terracotta",
                )}
              >
                {label}
              </span>
              <span className="block flex-1 pb-1 pr-8 pt-3.5">
                <span
                  className={cn(
                    "flex h-6 items-center text-[15px] font-medium text-brand-ink",
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
                selected ? "font-medium text-brand-ink" : "text-brand-subtle",
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
              "h-4 w-4 shrink-0 text-brand-ink transition",
              floating && "absolute right-3.5 top-1/2 -translate-y-1/2",
              open && "rotate-180",
            )}
            strokeWidth={2.5}
          />
        </button>

        {open ? (
          <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border-2 border-brand-ink bg-brand-cream shadow-[0_18px_40px_rgba(28,19,59,0.14)]">
            {searchable ? (
              <div className="flex items-center gap-2 border-b border-brand-sand px-3 py-2">
                <Search
                  className="h-4 w-4 shrink-0 text-brand-subtle"
                  strokeWidth={2.5}
                />
                <input
                  className="h-9 w-full bg-transparent text-sm text-brand-ink outline-none placeholder:text-brand-subtle"
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
                <li className="px-3 py-2.5 text-sm text-brand-subtle">
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
                            ? "bg-brand-ink text-white"
                            : "text-brand-ink hover:bg-brand-ink hover:text-white",
                        )}
                        aria-selected={isSelected}
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
            "group/field relative h-11 w-full rounded-xl border-2 border-brand-ink bg-transparent px-3.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink",
            error && "border-brand-terracotta focus-visible:ring-brand-terracotta",
            open && "ring-2 ring-brand-ink",
          )}
          id={fieldId}
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          <span
            className={cn(
              "pointer-events-none absolute left-3.5 right-10 origin-left transition-all duration-150",
              empty && !open
                ? "top-1/2 -translate-y-1/2 text-[15px] font-normal text-brand-subtle"
                : "top-1.5 translate-y-0 text-[11px] font-semibold leading-none text-brand-muted",
              open && "text-brand-ink",
              error && "text-brand-terracotta",
            )}
          >
            {label}
          </span>
          <span className="block pb-1 pr-8 pt-3.5">
            <span
              className={cn(
                "block h-6 truncate text-[15px] leading-6 text-brand-ink",
                empty && "text-transparent",
              )}
            >
              {display || "Select date"}
            </span>
          </span>
          <CalendarDays
            aria-hidden
            className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-ink"
            strokeWidth={2.25}
          />
        </button>

        {open ? (
          <div
            className="absolute right-0 z-30 mt-1.5 w-[15rem] rounded-xl border-2 border-brand-ink bg-brand-cream p-2 shadow-[0_12px_28px_rgba(28,19,59,0.12)]"
            role="dialog"
          >
            <div className="mb-1.5 flex items-center justify-between gap-1">
              <button
                aria-label="Previous month"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-brand-ink/35 text-base leading-none text-brand-ink transition hover:border-brand-ink touch-manipulation"
                onClick={() => shiftMonth(-1)}
                type="button"
              >
                ‹
              </button>
              <p className="text-xs font-semibold text-brand-ink">{monthLabel}</p>
              <button
                aria-label="Next month"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-brand-ink/35 text-base leading-none text-brand-ink transition hover:border-brand-ink touch-manipulation"
                onClick={() => shiftMonth(1)}
                type="button"
              >
                ›
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium text-brand-subtle">
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
                        ? "bg-brand-ink font-semibold text-white"
                        : "text-brand-ink hover:bg-brand-ink/10",
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

const ONBOARDING_PAGE_BG = "bg-brand-cream";

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
          "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-brand-ink transition",
          checked ? "bg-brand-ink text-white" : "bg-transparent",
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
              "rounded-2xl border-2 bg-brand-cream p-4 text-left transition touch-manipulation",
              active
                ? "border-brand-ink bg-white"
                : "border-brand-ink/35 hover:border-brand-ink",
            )}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            <p className="font-semibold text-brand-ink">{option.label}</p>
            {option.description ? (
              <p className="mt-1 text-sm leading-5 text-brand-muted">
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
        className="flex overflow-hidden rounded-full border-2 border-brand-ink"
        role="radiogroup"
      >
        {options.map((option, index) => {
          const active = value === option.value;
          return (
            <button
              aria-checked={active}
              className={cn(
                "min-w-0 flex-1 px-3 py-2.5 text-center text-xs font-semibold transition touch-manipulation",
                index > 0 && "border-l-2 border-brand-ink",
                active
                  ? "bg-brand-ink text-white"
                  : "bg-brand-cream text-brand-ink hover:bg-white",
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
        <p className="text-sm leading-5 text-brand-muted">{selected.hint}</p>
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
                ? "border-brand-ink bg-brand-ink text-white"
                : "border-brand-ink/40 bg-transparent text-brand-ink hover:border-brand-ink",
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
                ? "border-brand-ink bg-brand-ink text-white"
                : "border-brand-ink/40 bg-transparent text-brand-ink hover:border-brand-ink",
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
              "rounded-2xl border-2 bg-brand-cream p-4 text-left transition touch-manipulation",
              active
                ? "border-brand-ink bg-white"
                : "border-brand-ink/35 hover:border-brand-ink",
            )}
            key={option.value}
            onClick={() => toggle(option.value)}
            type="button"
          >
            <p className="font-semibold text-brand-ink">{option.label}</p>
            {option.description ? (
              <p className="mt-1 text-sm leading-5 text-brand-muted">
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
      <h3 className="text-base font-bold text-brand-ink">
        Frequently asked questions
      </h3>
      <ul className="divide-y divide-brand-sand rounded-2xl border-2 border-brand-ink bg-brand-cream">
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
                <span className="text-sm font-semibold text-brand-ink">
                  {item.q}
                </span>
                <ChevronDown
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0 text-brand-ink transition",
                    expanded && "rotate-180",
                  )}
                />
              </button>
              {expanded ? (
                <p className="px-4 pb-3.5 text-sm leading-6 text-brand-muted">
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
        className="mt-0.5 h-4 w-4 shrink-0 text-brand-ink"
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
        "inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-brand-ink px-5 text-sm font-semibold touch-manipulation",
        secondary
          ? "bg-brand-cream text-brand-ink hover:bg-brand-ink hover:text-white"
          : "bg-brand-ink text-white hover:bg-brand-indigo",
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
      className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-brand-ink bg-brand-cream px-5 text-sm font-semibold text-brand-ink touch-manipulation hover:bg-brand-ink hover:text-white"
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

export function SuccessBanner({ children }: { children: ReactNode }) {
  return (
    <motion.div
      animate={{ opacity: 1, scale: 1, y: 0 }}
      aria-live="polite"
      className="flex items-center gap-2.5 rounded-2xl border-2 border-emerald-700/30 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
      initial={{ opacity: 0, scale: 0.97, y: -10 }}
      transition={SPRING.lively}
    >
      <motion.span
        animate={{ rotate: 0, scale: 1 }}
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"
        initial={{ rotate: -45, scale: 0 }}
        transition={{ ...SPRING.lively, delay: 0.12 }}
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </motion.span>
      <span>{children}</span>
    </motion.div>
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
                ? "border-brand-ink bg-brand-ink text-white"
                : "border-brand-ink bg-brand-cream text-brand-ink",
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

function fileNameFromUrl(url?: string) {
  if (!url) return null;
  try {
    const path = new URL(url, "https://local.invalid").pathname;
    const base = path.split("/").filter(Boolean).pop();
    if (!base) return null;
    return decodeURIComponent(base);
  } catch {
    return null;
  }
}

export type DocumentUploadFileRow = {
  key: string;
  name: string;
  onRemove?: () => void;
  progress?: number;
  uploading?: boolean;
};

function DocumentFileRow({
  name,
  onRemove,
  progress,
  removeLabel,
  uploading = false,
}: {
  name: string;
  onRemove?: () => void;
  progress?: number;
  removeLabel: string;
  uploading?: boolean;
}) {
  const percent =
    typeof progress === "number"
      ? Math.max(0, Math.min(100, Math.round(progress)))
      : null;

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-brand-ink">{name}</p>
          <p className="mt-0.5 text-xs text-brand-subtle">
            {uploading ? `Uploading… ${percent ?? 0}%` : "Uploaded"}
          </p>
        </div>
        {!uploading && onRemove ? (
          <button
            aria-label={removeLabel}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-brand-ink text-brand-ink transition hover:bg-brand-ink hover:text-white"
            onClick={onRemove}
            type="button"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.75} />
          </button>
        ) : null}
      </div>
      {uploading ? (
        <div
          aria-hidden
          className="h-1.5 overflow-hidden rounded-full bg-brand-sand"
        >
          <motion.div
            animate={{ width: `${percent ?? 0}%` }}
            className="h-full rounded-full bg-brand-indigo"
            initial={{ width: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          />
        </div>
      ) : null}
    </div>
  );
}

export function DocumentUpload({
  accept = ".pdf,image/*",
  error,
  fileName: fileNameProp,
  files,
  label,
  maxFiles,
  onFile,
  onRemove,
  previewUrl,
  progress,
  uploaded,
  uploading = false,
}: {
  accept?: string;
  error?: string;
  /** Optional display name when the parent already knows the file. */
  fileName?: string;
  /**
   * Multi-file mode: one dropzone, uploaded files listed underneath.
   * Choosing a file always adds (append); each row can remove itself.
   */
  files?: DocumentUploadFileRow[];
  label: string;
  /** Cap for multi-file mode. Dropzone disables once reached. */
  maxFiles?: number;
  onFile: (file: File) => void;
  onRemove?: () => void;
  /** @deprecated Preview UI removed; kept for call-site compatibility. */
  previewIsPdf?: boolean;
  previewUrl?: string;
  progress?: number;
  uploaded: boolean;
  uploading?: boolean;
}) {
  const inputId = useId();
  const [dragActive, setDragActive] = useState(false);
  const [pickedName, setPickedName] = useState<string | null>(null);
  const multi = Array.isArray(files);
  const imageOnly =
    accept.includes("image") &&
    !accept.includes(".pdf") &&
    !accept.includes("pdf");
  const atMax =
    multi &&
    typeof maxFiles === "number" &&
    files.length >= maxFiles &&
    !uploading;
  const hasFile = uploaded || Boolean(previewUrl) || Boolean(pickedName);
  const displayName =
    fileNameProp?.trim() ||
    pickedName ||
    fileNameFromUrl(previewUrl) ||
    (hasFile ? "Uploaded file" : null);
  const chooseLabel = multi
    ? files.length > 0
      ? "Add another file"
      : "Choose file"
    : hasFile
      ? "Replace file"
      : "Choose file";

  useEffect(() => {
    if (multi) {
      if (!uploading) setPickedName(null);
      return;
    }
    if (!uploaded && !previewUrl && !uploading) {
      setPickedName(null);
    }
  }, [multi, previewUrl, uploaded, uploading]);

  function takeFile(file: File | undefined | null) {
    if (!file || uploading || atMax) return;
    setPickedName(file.name);
    onFile(file);
  }

  function onDragEnter(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!uploading && !atMax) setDragActive(true);
  }

  function onDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!uploading && !atMax) setDragActive(true);
  }

  function onDragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    takeFile(event.dataTransfer.files?.[0]);
  }

  const pendingMultiUpload =
    multi &&
    uploading &&
    pickedName &&
    !files.some((row) => row.uploading);

  return (
    <div className="w-full space-y-3">
      <p className="text-sm font-medium text-brand-plum">{label}</p>
      <label
        className={cn(
          "flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed bg-brand-cream p-8 text-center transition",
          error
            ? "border-brand-terracotta hover:border-brand-terracotta"
            : dragActive
              ? "border-brand-ink bg-[#f3eee4]"
              : "border-brand-ink/55 hover:border-brand-ink",
          (uploading || atMax) && "pointer-events-none opacity-70",
        )}
        htmlFor={inputId}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <FileUp className="h-8 w-8 text-brand-ink" strokeWidth={2.25} />
        <b className="mt-3 text-sm text-brand-plum">
          {atMax ? "Upload limit reached" : chooseLabel}
        </b>
        <span className="mt-1 text-xs text-brand-subtle">
          {dragActive
            ? "Drop to upload"
            : imageOnly
              ? "Drag and drop, or browse · JPEG, PNG or WebP"
              : "Drag and drop, or browse · PDF, JPEG, PNG or WebP"}
        </span>
        <input
          accept={accept}
          className="hidden"
          disabled={uploading || atMax}
          id={inputId}
          onChange={(event) => {
            takeFile(event.target.files?.[0]);
            event.target.value = "";
          }}
          type="file"
        />
      </label>

      {multi ? (
        <div className="space-y-2">
          {files.map((row) => (
            <DocumentFileRow
              key={row.key}
              name={row.name}
              onRemove={
                row.onRemove
                  ? () => {
                      setPickedName(null);
                      row.onRemove?.();
                    }
                  : undefined
              }
              progress={row.progress}
              removeLabel={`Remove ${row.name}`}
              uploading={row.uploading}
            />
          ))}
          {pendingMultiUpload ? (
            <DocumentFileRow
              name={pickedName}
              progress={progress}
              removeLabel={`Remove ${pickedName}`}
              uploading
            />
          ) : null}
        </div>
      ) : displayName || uploading ? (
        <DocumentFileRow
          name={displayName || "Uploading…"}
          onRemove={
            onRemove
              ? () => {
                  setPickedName(null);
                  onRemove();
                }
              : undefined
          }
          progress={progress}
          removeLabel={`Remove ${label}`}
          uploading={uploading}
        />
      ) : null}

      {error ? (
        <div>
          <FieldError message={error} />
        </div>
      ) : null}
    </div>
  );
}

export { ONBOARDING_PAGE_BG };
