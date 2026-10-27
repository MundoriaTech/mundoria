"use client";

import { Inbox, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

import { fadeFrom, SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The one empty state. Fades up on mount with the icon popping in, so an
 * empty list still feels alive instead of broken.
 */
export function EmptyState({
  action,
  className,
  compact = false,
  eyebrow,
  icon: Icon = Inbox,
  message,
  title = "Nothing here yet",
}: {
  action?: ReactNode;
  className?: string;
  /** Tighter padding for table cells and side panels. */
  compact?: boolean;
  eyebrow?: string;
  icon?: LucideIcon;
  message: ReactNode;
  title?: string;
}) {
  return (
    <motion.div
      animate="visible"
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed border-brand-lavender bg-white/70 text-center",
        compact ? "px-4 py-6" : "px-6 py-10 sm:py-12",
        className,
      )}
      initial="hidden"
      variants={fadeFrom("up", { distance: 16 })}
    >
      <motion.span
        animate={{ scale: 1 }}
        className={cn(
          "flex items-center justify-center rounded-full bg-brand-lavender-light text-brand-purple",
          compact ? "h-10 w-10" : "h-12 w-12",
        )}
        initial={{ scale: 0.6 }}
        transition={{ ...SPRING.lively, delay: 0.08 }}
      >
        <Icon
          className={compact ? "h-[1.125rem] w-[1.125rem]" : "h-5 w-5"}
          strokeWidth={1.9}
        />
      </motion.span>
      {eyebrow ? (
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-gold">
          {eyebrow}
        </p>
      ) : null}
      <h3
        className={cn(
          "font-semibold tracking-[-0.02em] text-brand-ink",
          eyebrow ? "mt-1.5" : "mt-4",
          compact ? "text-base" : "text-lg",
        )}
      >
        {title}
      </h3>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-brand-muted">
        {message}
      </p>
      {action ? <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </motion.div>
  );
}
