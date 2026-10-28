"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

export function AuthSignupLegal({
  checked,
  id = "marketing-opt-in",
  onCheckedChange,
}: {
  checked: boolean;
  id?: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="space-y-3">
      <label
        className="flex cursor-pointer items-start gap-3.5 text-sm leading-6 text-brand-muted"
        htmlFor={id}
      >
        <span className="relative mt-0.5 inline-flex size-8 shrink-0">
          <input
            checked={checked}
            className="peer absolute inset-0 z-10 size-full cursor-pointer opacity-0"
            id={id}
            onChange={(event) => onCheckedChange(event.target.checked)}
            type="checkbox"
          />
          <span
            aria-hidden
            className={cn(
              "pointer-events-none flex size-8 items-center justify-center rounded-lg border bg-white transition",
              "border-[#cfc8d8] peer-focus-visible:ring-2 peer-focus-visible:ring-brand-purple/35",
              "peer-checked:border-[#d4a017] peer-checked:bg-[#d4a017]",
            )}
          >
            <svg
              className={cn(
                "h-4 w-4 transition",
                checked ? "opacity-100 scale-100" : "opacity-0 scale-75",
              )}
              fill="none"
              viewBox="0 0 16 16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3.2 8.2 6.5 11.4 12.8 4.4"
                stroke="#ffffff"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.4"
              />
            </svg>
          </span>
        </span>
        <span>
          I agree to receive Mundoria’s offers and news by email and SMS.
        </span>
      </label>
      <p className="text-xs leading-5 text-brand-subtle">
        By creating an account, you accept Mundoria’s{" "}
        <Link className="underline underline-offset-2 hover:text-brand-ink" href="/terms">
          terms of service
        </Link>{" "}
        and{" "}
        <Link className="underline underline-offset-2 hover:text-brand-ink" href="/privacy">
          privacy policy
        </Link>
        .
      </p>
    </div>
  );
}
