"use client";

import { Check } from "lucide-react";

import {
  passwordRequirements,
  type PasswordRequirement,
} from "@/lib/auth/password-requirements";
import { cn } from "@/lib/utils";

export function PasswordRequirementsList({ password }: { password: string }) {
  const rules = passwordRequirements(password);
  const started = password.length > 0;

  return (
    <ul
      aria-live="polite"
      className="space-y-1.5 rounded-xl border border-[#e8e8eb] bg-[#f7f6f8] px-3 py-3"
    >
      {rules.map((rule) => (
        <RequirementItem key={rule.id} rule={rule} started={started} />
      ))}
    </ul>
  );
}

function RequirementItem({
  rule,
  started,
}: {
  rule: PasswordRequirement;
  started: boolean;
}) {
  const done = rule.met;
  const pending = started && !done;

  return (
    <li
      className={cn(
        "flex items-center gap-2 text-sm leading-snug transition-colors",
        done ? "text-[#1c133b]" : pending ? "text-[#5c5670]" : "text-[#9a93ad]",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-full border",
          done
            ? "border-[#1c133b] bg-[#1c133b] text-white"
            : "border-[#cfc8d8] bg-white",
        )}
      >
        {done ? <Check className="size-2.5" strokeWidth={3} /> : null}
      </span>
      <span>{rule.label}</span>
    </li>
  );
}
