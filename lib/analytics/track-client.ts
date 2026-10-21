import type { UserActivityEventName } from "@/lib/analytics/user-activity";

/** Fire-and-forget client activity ping (authenticated cookie session). */
export function trackClientActivity(input: {
  eventName: Extract<UserActivityEventName, "booking_step_viewed">;
  metadata?: Record<string, unknown>;
  path?: string;
}) {
  if (typeof window === "undefined") return;
  void fetch("/api/activity", {
    body: JSON.stringify({
      eventName: input.eventName,
      metadata: input.metadata ?? {},
      path: input.path ?? window.location.pathname,
    }),
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    method: "POST",
  }).catch(() => {
    // Journey tracking must never block the UI.
  });
}
