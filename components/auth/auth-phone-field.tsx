"use client";

import type { FieldError as HookFieldError } from "react-hook-form";

import { FieldError } from "@/components/shared/action-error";
import { Input } from "@/components/ui/input";
import { UK_DIAL_CODE } from "@/lib/auth/uk-phone";
import { cn } from "@/lib/utils";

interface AuthPhoneFieldProps {
  error?: HookFieldError;
  hint?: string;
  htmlFor?: string;
  label?: string;
  nationalNumber: string;
  onNationalNumberChange: (value: string) => void;
  required?: boolean;
}

function UkFlag({ className }: { className?: string }) {
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

/** WeCasa-style UK phone control: flag + caret, floating label, national number. */
export function AuthPhoneField({
  error,
  hint,
  htmlFor = "phone-national",
  label = "Phone number",
  nationalNumber,
  onNationalNumberChange,
  required,
}: AuthPhoneFieldProps) {
  const empty = nationalNumber.trim().length === 0;

  return (
    <div className="space-y-1.5">
      <label
        className={cn(
          "group/phone relative flex min-h-[3.25rem] cursor-text items-stretch rounded-xl border bg-[#f6f5f8] transition",
          "focus-within:border-[#6a45b8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#6a45b8]/20",
          error ? "border-[#d4694a]" : "border-[#e4e0eb]",
        )}
        htmlFor={htmlFor}
      >
        <div
          aria-hidden
          className="flex shrink-0 items-center self-center pl-3.5 pr-1"
        >
          <UkFlag className="h-4 w-6 overflow-hidden rounded-[2px] shadow-sm" />
        </div>

        <div className="relative min-w-0 flex-1 px-2.5 py-2">
          <span
            className={cn(
              "pointer-events-none absolute left-2.5 right-3 z-[1] origin-left transition-all duration-150",
              empty
                ? "top-1/2 -translate-y-1/2 text-[15px] font-normal text-[#8b8798] group-focus-within/phone:top-2 group-focus-within/phone:translate-y-0 group-focus-within/phone:text-[11px] group-focus-within/phone:font-semibold group-focus-within/phone:text-[#6a45b8]"
                : "top-2 translate-y-0 text-[11px] font-semibold text-[#5a5470]",
              error && !empty && "text-[#d4694a]",
              error &&
                empty &&
                "group-focus-within/phone:text-[#d4694a]",
            )}
          >
            {label}
          </span>

          <div
            className={cn(
              "flex items-center gap-1.5 transition-all duration-150",
              empty
                ? "pt-0 opacity-0 group-focus-within/phone:pt-4 group-focus-within/phone:opacity-100"
                : "pt-4 opacity-100",
            )}
          >
            <span
              aria-hidden
              className="shrink-0 text-[15px] font-medium text-[#1c133b]"
            >
              {UK_DIAL_CODE}
            </span>
            <Input
              autoComplete="tel-national"
              className="auth-inset-input h-7 min-w-0 flex-1 !rounded-none !border-0 !bg-transparent px-0 py-0 text-[15px] !shadow-none !outline-none !ring-0 !ring-offset-0 placeholder:text-[#b0a9bc] focus:!border-0 focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!border-0 focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0"
              id={htmlFor}
              inputMode="tel"
              onChange={(event) => onNationalNumberChange(event.target.value)}
              placeholder="7400 123456"
              required={required}
              type="tel"
              value={nationalNumber}
            />
          </div>
        </div>
      </label>
      {hint ? (
        <p className="px-0.5 text-xs leading-5 text-[#8b8798]">{hint}</p>
      ) : null}
      {error?.message ? <FieldError message={error.message} /> : null}
    </div>
  );
}
