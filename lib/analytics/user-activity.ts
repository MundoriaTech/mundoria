import { createAdminClient } from "@/lib/supabase/admin";

/** Server-side and client-allowed journey events after signup. */
export const USER_ACTIVITY_EVENTS = [
  "signed_up",
  "email_confirmed",
  "profile_completed",
  "address_saved",
  "booking_step_viewed",
  "booking_created",
  "cleaner_onboarding_submitted",
] as const;

export type UserActivityEventName = (typeof USER_ACTIVITY_EVENTS)[number];

export const USER_ACTIVITY_LABELS: Record<UserActivityEventName, string> = {
  address_saved: "Saved an address",
  booking_created: "Created a booking",
  booking_step_viewed: "Viewed a booking step",
  cleaner_onboarding_submitted: "Submitted cleaner onboarding",
  email_confirmed: "Confirmed email",
  profile_completed: "Completed profile",
  signed_up: "Signed up",
};

const CLIENT_ALLOWED = new Set<UserActivityEventName>([
  "booking_step_viewed",
]);

export function isUserActivityEventName(
  value: string,
): value is UserActivityEventName {
  return (USER_ACTIVITY_EVENTS as readonly string[]).includes(value);
}

export function isClientAllowedActivityEvent(
  value: string,
): value is UserActivityEventName {
  return isUserActivityEventName(value) && CLIENT_ALLOWED.has(value);
}

export function activityEventLabel(
  eventName: string,
  metadata?: Record<string, unknown> | null,
): string {
  if (eventName === "booking_step_viewed") {
    const step = typeof metadata?.step === "string" ? metadata.step : null;
    if (step) {
      return `Booking step: ${step.replaceAll("_", " ")}`;
    }
  }
  if (isUserActivityEventName(eventName)) {
    return USER_ACTIVITY_LABELS[eventName];
  }
  return eventName.replaceAll("_", " ");
}

export async function trackUserActivity(input: {
  eventName: UserActivityEventName;
  metadata?: Record<string, unknown>;
  path?: string | null;
  userId: string;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("user_activity_events").insert({
      event_name: input.eventName,
      metadata: input.metadata ?? {},
      path: input.path ?? null,
      user_id: input.userId,
    });
    if (error) {
      console.error("[user-activity]", error.message);
    }
  } catch (error) {
    console.error("[user-activity]", error);
  }
}
