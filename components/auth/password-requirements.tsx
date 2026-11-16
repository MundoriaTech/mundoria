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
  const unmet = rules.filter((rule) => !rule.met);
  const allMet = started && unmet.length === 0;

  return (
    <div aria-live="polite" className="space-y-1.5 px-0.5">
      <ul className="flex gap-1" role="list">
        {rules.map((rule) => (
          <Segment key={rule.id} rule={rule} />
        ))}
      </ul>
      <ul className="grid grid-cols-1 gap-x-4 gap-y-1 text-[12px] leading-5 sm:grid-cols-2" role="list">
        {rules.map((rule) => (
          <li
            className={cn(
              "flex items-center gap-2 transition-colors",
              rule.met ? "text-brand-plum" : "text-brand-subtle",
            )}
            key={rule.id}
          >
            <motion.span
              animate={{
                backgroundColor: rule.met ? "#6a45b8" : "#ffffff",
                borderColor: rule.met ? "#6a45b8" : "#cfc8dd",
                scale: rule.met ? 1 : 0.9,
              }}
              className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-white"
              initial={false}
              transition={rule.met ? SPRING.lively : { duration: DURATION.fast, ease: EASE.out }}
            >
              <AnimatePresence initial={false}>
                {rule.met ? (
                  <motion.span
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex"
                    exit={{ opacity: 0, scale: 0.4 }}
                    initial={{ opacity: 0, scale: 0.4 }}
                    key="check"
                    transition={{ duration: DURATION.fast }}
                  >
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </motion.span>
            <span className={cn(rule.met && "line-through decoration-brand-purple/50")}>{rule.example}</span>
          </li>
        ))}
      </ul>
      <AnimatePresence initial={false}>
        {allMet ? (
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-plum"
            exit={{ opacity: 0, y: -4 }}
            initial={{ opacity: 0, y: 6 }}
            transition={{ duration: DURATION.fast, ease: EASE.out }}
          >
            Password looks good
          </motion.p>
        ) : null}
      </AnimatePresence>
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
          "whitespace-nowrap rounded-md bg-brand-plum px-2 py-1 text-[10px] font-medium text-white shadow-sm",
          "opacity-0 transition-opacity duration-150 group-hover/seg:opacity-100",
        )}
      >
        <span className="font-semibold">{rule.glyph}</span>
        <span className="text-white/80"> · {rule.label}</span>
      </span>
    </li>
  );
}
