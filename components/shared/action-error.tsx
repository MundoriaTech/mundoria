"use client";

import { CircleAlert } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { DURATION, EASE } from "@/lib/motion";

/** A short sideways shake that says "that didn't go through". */
function shake(reduced: boolean | null) {
  return reduced
    ? { opacity: 1 }
    : { opacity: 1, x: [0, -7, 7, -5, 5, -2, 2, 0] };
}

const shakeTransition = {
  opacity: { duration: DURATION.fast, ease: EASE.out },
  x: { duration: 0.5, ease: EASE.inOut },
} as const;

export function ActionError({
  message,
  title,
}: {
  message?: string;
  title: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      animate={shake(reduced)}
      className="flex gap-3 rounded-xl bg-[#fff1ea] p-4"
      initial={{ opacity: 0 }}
      key={`${title}:${message ?? ""}`}
      role="alert"
      transition={shakeTransition}
    >
      <CircleAlert
        aria-hidden
        className="mt-0.5 h-5 w-5 shrink-0 text-brand-terracotta"
      />
      <div>
        <p className="text-sm font-semibold text-[#221f50]">{title}</p>
        {message ? (
          <p className="mt-1 text-sm leading-6 text-[#9a3412]">{message}</p>
        ) : null}
      </div>
    </motion.div>
  );
}

export function FieldError({ message }: { message: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.p
      animate={reduced ? { opacity: 1, y: 0 } : { opacity: 1, x: [0, -4, 4, -2, 2, 0], y: 0 }}
      className="flex items-start gap-1.5 text-sm text-[#9a3412]"
      initial={{ opacity: 0, y: -4 }}
      key={message}
      role="alert"
      transition={{
        opacity: { duration: DURATION.fast },
        x: { duration: 0.4, ease: EASE.inOut },
        y: { duration: DURATION.fast, ease: EASE.out },
      }}
    >
      <CircleAlert
        aria-hidden
        className="mt-0.5 h-4 w-4 shrink-0 text-brand-terracotta"
      />
      <span>{message}</span>
    </motion.p>
  );
}

/** Terracotta border for the control that failed. */
export const invalidControlClass =
  "border-brand-terracotta focus-visible:ring-brand-terracotta";

/** Apply when an input or textarea is nested inside the wrapper. */
export const invalidControlWrap =
  "[&_input]:border-brand-terracotta [&_input]:focus-visible:ring-brand-terracotta [&_textarea]:border-brand-terracotta [&_textarea]:focus-visible:ring-brand-terracotta";
