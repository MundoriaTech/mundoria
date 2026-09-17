/** Shared landing nav metrics — safe to import from server or client components. */

export const LANDING_NAV_TOP =
  "max(1.25rem, env(safe-area-inset-top, 0px) + 0.5rem)";

/** Resolves via `--landing-nav-pill-h` (shorter on mobile, 4.75rem from lg). */
export const LANDING_NAV_PILL_H = "var(--landing-nav-pill-h)";
export const LANDING_NAV_PILL_RADIUS = "1.125rem"; /* 18px */

/** Sticky header block height (top inset + pill). */
export const LANDING_NAV_BLOCK = `calc(${LANDING_NAV_TOP} + ${LANDING_NAV_PILL_H})`;
