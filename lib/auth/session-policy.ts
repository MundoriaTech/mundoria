export type SessionAudience = "customer" | "cleaner" | "admin";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Stay signed in for a full day of inactivity, and no longer than a day from sign-in. */
export const SESSION_POLICY: Record<
  SessionAudience,
  {
    /** End session after this much inactivity. */
    idleMs: number;
    /** Hard cap from original sign-in, even if active. */
    absoluteMs: number;
    /** Warn the user this long before idle logout. */
    warnBeforeIdleMs: number;
    loginPath: string;
  }
> = {
  customer: {
    idleMs: DAY_MS,
    absoluteMs: DAY_MS,
    warnBeforeIdleMs: 60 * 1000,
    loginPath: "/login",
  },
  cleaner: {
    idleMs: DAY_MS,
    absoluteMs: DAY_MS,
    warnBeforeIdleMs: 60 * 1000,
    loginPath: "/login/cleaner",
  },
  admin: {
    idleMs: DAY_MS,
    absoluteMs: DAY_MS,
    warnBeforeIdleMs: 60 * 1000,
    loginPath: "/admin/login",
  },
};

export const SESSION_STARTED_KEY = "mundoria-session-started-at";
export const SESSION_ACTIVITY_KEY = "mundoria-session-activity-at";
