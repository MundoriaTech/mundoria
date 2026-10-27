"use client";

import { Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import {
  passwordRequirements,
  type PasswordRequirement,
} from "@/lib/auth/password-requirements";
import { DURATION, EASE, SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function PasswordRequirementsList({ password }: { password: string }) {
  const rules = passwordRequirements(password);
  const started = password.length > 0;
  const metCount = rules.filter((rule) => rule.met).length;
  const unmet = rules.filter((rule) => !rule.met);
  const allMet = started && unmet.length === 0;
  const statusKey = allMet ? "ok" : started ? `progress-${metCount}` : "idle";

  return (
    <div aria-live="polite" className="space-y-1.5 px-0.5">
      <ul className="flex gap-1" role="list">
        {rules.map((rule) => (
          <Segment key={rule.id} rule={rule} />
        ))}
      </ul>
      <div className="relative min-h-4 overflow-hidden text-[11px] leading-4 text-[#8b8798]">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              transition: { duration: DURATION.fast, ease: EASE.in },
              y: -6,
            }}
            initial={{ opacity: 0, y: 6 }}
            key={statusKey}
            transition={{ duration: DURATION.fast, ease: EASE.out }}
          >
            {allMet ? (
              <span className="inline-flex items-center gap-1 font-medium text-[#291845]">
                <motion.span
                  animate={{ rotate: 0, scale: 1 }}
                  className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#6a45b8] text-white"
                  initial={{ rotate: -45, scale: 0 }}
                  transition={SPRING.lively}
                >
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </motion.span>
                Password looks good
              </span>
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
          </motion.p>
        </AnimatePresence>
      </div>
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
      <motion.span
        animate={{
          backgroundColor: rule.met ? "#6a45b8" : "#e4e0eb",
          scaleY: rule.met ? 1.25 : 1,
        }}
        aria-hidden
        className="block h-1.5 origin-center rounded-full"
        transition={SPRING.snappy}
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
