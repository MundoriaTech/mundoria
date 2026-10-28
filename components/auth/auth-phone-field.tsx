"use client";

import type { FieldError as HookFieldError } from "react-hook-form";

import { FieldError } from "@/components/shared/action-error";
import { Input } from "@/components/ui/input";
import { UK_DIAL_CODE } from "@/lib/auth/uk-phone";
import { cn } from "@/lib/utils";

interface AuthPhoneFieldProps {
  className?: string;
  error?: HookFieldError;
  hint?: string;
  htmlFor?: string;
  label?: string;
  nationalNumber: string;
  onNationalNumberChange: (value: string) => void;
  required?: boolean;
}

export function UkFlag({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      viewBox="0 0 60 30"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect fill="#012169" height="30" rx="2" width="60" />
      <path d="M0,0 60,30 M60,0 0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 60,30 M60,0 0,30" stroke="#C8102E" strokeWidth="2" />
      <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

/** UK phone control: flag, dial code, and national number. */
export function AuthPhoneField({
  className,
  error,
  hint,
  htmlFor = "phone-national",
  label = "Phone number",
  nationalNumber,
  onNationalNumberChange,
  required,
}: AuthPhoneFieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        className="block text-sm font-medium text-brand-ink"
        htmlFor={htmlFor}
      >
        {label}
        {required ? (
          <span className="sr-only"> (required)</span>
        ) : null}
      </label>
      <div
        className={cn(
          "flex min-h-11 items-center gap-2 rounded-xl border bg-[#f6f5f8] px-3.5 transition",
          "focus-within:ring-2 focus-within:ring-brand-purple/20",
          error ? "border-brand-terracotta" : "border-[#e4e0eb]",
          className,
          error ? "border-brand-terracotta" : null,
        )}
      >
        <span aria-hidden className="shrink-0">
          <UkFlag className="h-4 w-6 overflow-hidden rounded-[2px]" />
        </span>
        <span
          aria-hidden
          className="shrink-0 text-[15px] font-medium text-brand-ink"
        >
          {UK_DIAL_CODE}
        </span>
        <Input
          autoComplete="tel-national"
          className="auth-inset-input h-9 min-w-0 flex-1 !rounded-none !border-0 !bg-transparent px-0 py-0 text-[15px] !shadow-none !outline-none !ring-0 !ring-offset-0 placeholder:text-[#b0a9bc] focus:!border-0 focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0"
          id={htmlFor}
          inputMode="tel"
          onChange={(event) => onNationalNumberChange(event.target.value)}
          placeholder="7400 123456"
          required={required}
          type="tel"
          value={nationalNumber}
        />
      </div>
      {hint ? (
        <p className="px-0.5 text-xs leading-5 text-brand-subtle">{hint}</p>
      ) : null}
      {error?.message ? <FieldError message={error.message} /> : null}
    </div>
  );
}
