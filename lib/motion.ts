import type { Transition, Variants } from "motion/react";

/**
 * Shared motion tokens. Every animation in the app should pull its timing
 * and easing from here so the whole product moves with one voice.
 *
 * Durations are in seconds (Motion's unit).
 */
export const DURATION = {
  /** Hover, press, toggles. */
  fast: 0.16,
  /** Most enters: cards, panels, modals. */
  base: 0.28,
  /** Larger surfaces: sheets, wizard steps. */
  slow: 0.42,
  /** Scroll reveals on marketing pages. */
  reveal: 0.6,
} as const;

export const EASE = {
  /** Fast start, soft landing. The default for anything entering. */
  out: [0.22, 1, 0.36, 1],
  /** Symmetrical. For things that move and stay on screen (tabs, sliders). */
  inOut: [0.65, 0, 0.35, 1],
  /** Quick exits. */
  in: [0.4, 0, 1, 1],
} as const;

export const SPRING = {
  /** Snappy, almost no bounce. Layout and indicator moves. */
  snappy: { type: "spring", stiffness: 420, damping: 34, mass: 0.8 },
  /** A touch of bounce for playful entrances (cards, badges). */
  lively: { type: "spring", stiffness: 300, damping: 22, mass: 0.9 },
  /** Soft and slow. Sheets and large panels. */
  gentle: { type: "spring", stiffness: 180, damping: 26, mass: 1 },
} as const satisfies Record<string, Transition>;

export const transition = {
  fast: { duration: DURATION.fast, ease: EASE.out } as Transition,
  base: { duration: DURATION.base, ease: EASE.out } as Transition,
  slow: { duration: DURATION.slow, ease: EASE.out } as Transition,
  reveal: { duration: DURATION.reveal, ease: EASE.out } as Transition,
} as const;

/** Where an element enters from. Diagonals keep things lively; use sparingly. */
export type EnterFrom =
  | "up"
  | "down"
  | "left"
  | "right"
  | "up-left"
  | "up-right"
  | "down-left"
  | "down-right"
  | "scale"
  | "none";

export function enterOffset(from: EnterFrom, distance = 24) {
  const diagonal = Math.round(distance * 0.7);
  switch (from) {
    case "up":
      return { x: 0, y: distance };
    case "down":
      return { x: 0, y: -distance };
    case "left":
      return { x: -distance, y: 0 };
    case "right":
      return { x: distance, y: 0 };
    case "up-left":
      return { x: -diagonal, y: diagonal };
    case "up-right":
      return { x: diagonal, y: diagonal };
    case "down-left":
      return { x: -diagonal, y: -diagonal };
    case "down-right":
      return { x: diagonal, y: -diagonal };
    default:
      return { x: 0, y: 0 };
  }
}

/**
 * Fade + travel variants. Pair with `initial="hidden" animate="visible"`
 * (or `whileInView="visible"`) on a `motion` element.
 */
export function fadeFrom(
  from: EnterFrom = "up",
  options: { delay?: number; distance?: number; duration?: number } = {},
): Variants {
  const { delay = 0, distance = 24, duration = DURATION.base } = options;
  const offset = enterOffset(from, distance);
  const scale = from === "scale" ? 0.96 : 1;
  return {
    hidden: { opacity: 0, scale, x: offset.x, y: offset.y },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { delay, duration, ease: EASE.out },
      x: 0,
      y: 0,
    },
  };
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transition.base },
};

/**
 * Parent variants that stagger children. Children should use `fadeFrom`
 * variants with the same `hidden` / `visible` keys.
 */
export function staggerContainer(
  stagger = 0.06,
  delayChildren = 0,
): Variants {
  return {
    hidden: {},
    visible: {
      transition: { delayChildren, staggerChildren: stagger },
    },
  };
}

/**
 * Direction-aware step transition for wizards. `custom` is +1 when moving
 * forward and -1 when going back, so the new step always arrives from the
 * side the user is heading towards.
 */
export const slideStep: Variants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 56 : -56,
  }),
  center: {
    opacity: 1,
    transition: { duration: DURATION.slow, ease: EASE.out },
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    transition: { duration: DURATION.fast, ease: EASE.in },
    x: direction > 0 ? -40 : 40,
  }),
};

/** Modal and popover panels. */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.base, ease: EASE.out },
    y: 0,
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: DURATION.fast, ease: EASE.in },
    y: 4,
  },
};

/** Bottom sheets on mobile. */
export const sheetUp: Variants = {
  hidden: { y: "100%" },
  visible: { transition: SPRING.gentle, y: 0 },
  exit: { transition: { duration: DURATION.base, ease: EASE.in }, y: "100%" },
};

/** Pass to `viewport` on `whileInView` elements. */
export const viewportOnce = {
  amount: 0.2,
  margin: "0px 0px -10% 0px",
  once: true,
} as const;

/** Hover lift + press squash for cards and buttons. Spread onto a motion element. */
export const pressable = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.98 },
  transition: transition.fast,
} as const;
