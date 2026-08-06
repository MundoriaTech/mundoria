export type SessionAudience = "customer" | "cleaner" | "admin";

/** Session limits aligned with OWASP guidance for marketplace vs privileged admin. */
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
    idleMs: 30 * 60 * 1000,
    absoluteMs: 12 * 60 * 60 * 1000,
    warnBeforeIdleMs: 60 * 1000,
    loginPath: "/login",
  },
  cleaner: {
    idleMs: 30 * 60 * 1000,
    absoluteMs: 12 * 60 * 60 * 1000,
    warnBeforeIdleMs: 60 * 1000,
    loginPath: "/login",
  },
  admin: {
    idleMs: 15 * 60 * 1000,
    absoluteMs: 8 * 60 * 60 * 1000,
    warnBeforeIdleMs: 60 * 1000,
    loginPath: "/admin/login",
  },
};

export const SESSION_STARTED_KEY = "cleanscape-session-started-at";
export const SESSION_ACTIVITY_KEY = "cleanscape-session-activity-at";
