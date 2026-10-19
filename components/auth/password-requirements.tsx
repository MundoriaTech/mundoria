"use client";

import {
  passwordRequirements,
  type PasswordRequirement,
} from "@/lib/auth/password-requirements";
import { cn } from "@/lib/utils";

export function PasswordRequirementsList({ password }: { password: string }) {
  const rules = passwordRequirements(password);
  const started = password.length > 0;
  const metCount = rules.filter((rule) => rule.met).length;
  const unmet = rules.filter((rule) => !rule.met);
  const allMet = started && unmet.length === 0;

  return (
    <div aria-live="polite" className="space-y-1.5 px-0.5">
      <ul className="flex gap-1" role="list">
        {rules.map((rule) => (
          <Segment key={rule.id} rule={rule} />
        ))}
      </ul>
      <p className="text-[11px] leading-4 text-[#8b8798]">
        {allMet ? (
          <span className="font-medium text-[#291845]">Password looks good</span>
        ) : started ? (
          <>
            <span className="font-medium text-[#6a45b8]">
              {metCount} of {rules.length}
            </span>
            <span className="text-[#9a93ad]">
              {" · need "}
              {unmet
                .slice(0, 2)
                .map((rule) => rule.example)
                .join(", ")}
              {unmet.length > 2 ? "…" : ""}
            </span>
          </>
        ) : (
          "Must include an uppercase letter, a lowercase letter, a number, a symbol, and 8+ characters"
        )}
      </p>
      <span className="sr-only">
        {rules
          .map((rule) => `${rule.example}: ${rule.met ? "met" : "not met"}`)
          .join(". ")}
      </span>
    </div>
  );
}

function Segment({ rule }: { rule: PasswordRequirement }) {
  return (
    <li className="group/seg relative min-w-0 flex-1">
      <span
        aria-hidden
        className={cn(
          "block h-1.5 rounded-full transition-colors duration-150",
          rule.met ? "bg-[#6a45b8]" : "bg-[#e4e0eb]",
        )}
      />
      <span
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2",
          "whitespace-nowrap rounded-md bg-[#291845] px-2 py-1 text-[10px] font-medium text-white shadow-sm",
          "opacity-0 transition-opacity duration-150 group-hover/seg:opacity-100",
        )}
      >
        <span className="font-semibold">{rule.glyph}</span>
        <span className="text-white/80"> · {rule.label}</span>
      </span>
    </li>
  );
}
