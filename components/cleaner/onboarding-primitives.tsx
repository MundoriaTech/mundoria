"use client";

import { Check, ChevronDown, FileBadge, FileUp, Info, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { FieldError } from "@/components/shared/action-error";
import { cn } from "@/lib/utils";

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
        columns === 2 && "grid-cols-2",
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
    <div className="space-y-3">
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
            <div className="relative flex min-h-[12rem] items-center justify-center bg-[#f3f0f8]">
              {showImagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element -- signed/blob preview URLs
                <img
                  alt={`${label} preview`}
                  className="max-h-72 w-full object-contain"
                  src={previewUrl}
                />
              ) : looksLikePdf ? (
                <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
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
                <div className="flex flex-col items-center gap-3 px-6 py-10 text-[#6a45b8]">
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
