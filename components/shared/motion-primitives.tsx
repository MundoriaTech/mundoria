"use client";

import {
  animate,
  motion,
  useInView,
  useReducedMotion,
  type HTMLMotionProps,
} from "motion/react";
import {
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  type EnterFrom,
  fadeFrom,
  pressable,
  staggerContainer,
  viewportOnce,
} from "@/lib/motion";
import { cn } from "@/lib/utils";

type StaggerElement = "div" | "ul" | "ol" | "section" | "dl" | "tbody";

/**
 * Parent that staggers its `StaggerItem` children. Animates on mount by
 * default; pass `inView` to wait until it scrolls into view (marketing).
 */
export function Stagger({
  as = "div",
  children,
  className,
  delay = 0,
  gap = 0.06,
  inView = false,
  ...props
}: {
  as?: StaggerElement;
  children: ReactNode;
  className?: string;
  /** Seconds before the first child starts. */
  delay?: number;
  /** Seconds between children. */
  gap?: number;
  inView?: boolean;
} & Omit<HTMLMotionProps<"div">, "children" | "variants">) {
  const Component = motion[as] as typeof motion.div;
  return (
    <Component
      className={className}
      initial="hidden"
      variants={staggerContainer(gap, delay)}
      {...(inView
        ? { viewport: viewportOnce, whileInView: "visible" }
        : { animate: "visible" })}
      {...props}
    >
      {children}
    </Component>
  );
}

type ItemElement = "div" | "li" | "article" | "a" | "tr" | "span";

/**
 * Child of `Stagger`. `from` picks the entrance side; mix directions across
 * a row ("up", "up-left", "up-right") so a grid feels alive, not mechanical.
 */
export function StaggerItem({
  as = "div",
  children,
  className,
  distance = 22,
  from = "up",
  lift = false,
  ...props
}: {
  as?: ItemElement;
  children: ReactNode;
  className?: string;
  distance?: number;
  from?: EnterFrom;
  /** Adds hover lift + press squash. */
  lift?: boolean;
} & Omit<HTMLMotionProps<"div">, "children" | "variants">) {
  const Component = motion[as] as typeof motion.div;
  return (
    <Component
      className={className}
      variants={fadeFrom(from, { distance })}
      {...(lift ? pressable : {})}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * Picks an entrance direction for the n-th item in a row so neighbouring
 * cards arrive from slightly different angles.
 */
export function directionFor(index: number, columns = 3): EnterFrom {
  const column = index % columns;
  if (columns === 1) return "up";
  if (column === 0) return "up-right";
  if (column === columns - 1) return "up-left";
  return "up";
}

/**
 * Hover-lift, press-squash card wrapper. Use around any clickable surface
 * that should feel physical.
 */
export function MotionCard({
  as = "div",
  children,
  className,
  ...props
}: {
  as?: "div" | "article" | "li";
  children: ReactNode;
  className?: string;
} & Omit<HTMLMotionProps<"div">, "children">) {
  const Component = motion[as] as typeof motion.div;
  return (
    <Component className={className} {...pressable} {...props}>
      {children}
    </Component>
  );
}

const NUMBER_PATTERN = /^([^0-9-]*)(-?[0-9][0-9,]*(?:\.[0-9]+)?)(.*)$/;

/**
 * Animates the numeric part of a formatted value ("£109.74", "4", "98%")
 * from zero when it enters view. Non-numeric values render as-is. The
 * server renders the final value so nothing jumps before hydration.
 */
export function CountUp({
  className,
  duration = 1.1,
  value,
}: {
  className?: string;
  duration?: number;
  value: string | number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { amount: 0.6, once: true });
  const reduced = useReducedMotion();
  const text = String(value);
  const match = NUMBER_PATTERN.exec(text);
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (!match || reduced || !inView) {
      setDisplay(text);
      return;
    }
    const [, prefix, raw, suffix] = match;
    const target = Number(raw.replaceAll(",", ""));
    if (!Number.isFinite(target)) {
      setDisplay(text);
      return;
    }
    const decimals = raw.includes(".") ? raw.split(".")[1]!.length : 0;
    const grouped = raw.includes(",");
    const controls = animate(0, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        const fixed = latest.toFixed(decimals);
        const formatted = grouped
          ? Number(fixed).toLocaleString("en-GB", {
              maximumFractionDigits: decimals,
              minimumFractionDigits: decimals,
            })
          : fixed;
        setDisplay(`${prefix}${formatted}${suffix}`);
      },
    });
    return () => controls.stop();
    // `match` is derived from `text`; re-run only when the value changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, inView, reduced, text]);

  return (
    <span className={cn("tabular-nums", className)} ref={ref}>
      {display}
    </span>
  );
}

/** Progress bar that grows to `value` (0–100) when it scrolls into view. */
export function AnimatedBar({
  className,
  trackClassName,
  value,
}: {
  className?: string;
  trackClassName?: string;
  value: number;
}) {
  const width = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-muted", trackClassName)}>
      <motion.div
        className={cn("h-full rounded-full bg-primary", className)}
        initial={{ width: 0 }}
        transition={{ delay: 0.15, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        viewport={viewportOnce}
        whileInView={{ width: `${width}%` }}
      />
    </div>
  );
}

/** Simple fade-up on mount or in view for a single block. */
export function Reveal<T extends ElementType = "div">({
  as,
  children,
  className,
  delay = 0,
  distance = 20,
  from = "up",
  inView = false,
  ...props
}: {
  as?: T;
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
  from?: EnterFrom;
  inView?: boolean;
} & Omit<ComponentPropsWithoutRef<"div">, "children">) {
  const tag = (as ?? "div") as "div";
  const Component = motion[tag] as typeof motion.div;
  return (
    <Component
      className={className}
      initial="hidden"
      variants={fadeFrom(from, { delay, distance })}
      {...(inView
        ? { viewport: viewportOnce, whileInView: "visible" }
        : { animate: "visible" })}
      {...(props as HTMLMotionProps<"div">)}
    >
      {children}
    </Component>
  );
}
