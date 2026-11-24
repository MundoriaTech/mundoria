import { createAdminClient } from "@/lib/supabase/admin";
import { calendarClient, calendarConfig, CalendarFailure } from "@/lib/zoho/calendar";
import { onboardingEvent, rescheduledEvent } from "@/lib/zoho/calendar-event";
import { maySyncZohoEmail } from "@/lib/zoho/preview";

type CalendarJob = {
  cleaner_id: string; desired_start: string | null; source_version: number;
  event_uid: string | null; calendar_uid: string | null; claim_token: string; attempts: number;
};

/** Called by the existing authenticated heartbeat; never by browser-side code. */
export async function syncCleanerCalendar(onlyCleanerId?: string) {
  const config = calendarConfig();
  if (!config) return { enabled: false, processed: 0 };
  const admin = createAdminClient();
  let processed = 0;
  for (let i = 0; i < (onlyCleanerId ? 1 : 5); i++) {
    const claim = await admin.rpc("claim_cleaner_calendar", { p_cleaner_id: onlyCleanerId ?? null });
    if (claim.error) throw new Error("CALENDAR_QUEUE_UNAVAILABLE");
    const job = claim.data?.[0] as CalendarJob | undefined;
    if (!job) break;
    let eventUid = job.event_uid;
    let state = "needs_attention";
    let error: string | null = null;
    try {
      const profile = await admin.from("profiles").select("email,role").eq("id", job.cleaner_id).single();
      if (profile.error || !profile.data || profile.data.role !== "cleaner") {
        throw new CalendarFailure("CLEANER_CONTACT_UNAVAILABLE", true);
      }
      if (!maySyncZohoEmail(profile.data.email)) throw new CalendarFailure("CALENDAR_TEST_GUARD", true);
      if (job.calendar_uid && job.calendar_uid !== config.uid) throw new CalendarFailure("CALENDAR_TARGET_CHANGED");
      if (job.desired_start && Date.parse(job.desired_start) <= Date.now()) {
        throw new CalendarFailure("MEETING_TIME_HAS_PASSED");
      }
      if (!job.desired_start && !eventUid) {
        state = "cancelled"; // Cancelled before it was ever sent.
      } else {
        const client = await calendarClient(config);
        if (eventUid) {
          const existing = await client.get(eventUid);
          // Validate the source identity even for cancellation. No arbitrary
          // calendar event may be overwritten based on a corrupted mapping.
          const updated = rescheduledEvent(existing, job.desired_start ?? new Date().toISOString(), job.cleaner_id);
          if (job.desired_start) {
            await client.update(eventUid, updated);
            state = "synced";
          } else {
            await client.cancel(existing);
            eventUid = null;
            state = "cancelled";
          }
        } else {
          const saved = await client.create(onboardingEvent({ cleanerId: job.cleaner_id,
            email: profile.data.email, host: config.host, startsAt: job.desired_start!, instructions: config.instructions }));
          eventUid = saved.uid!;
          state = "synced";
        }
      }
    } catch (failure) {
      error = failure instanceof CalendarFailure ? failure.code :
        failure instanceof Error && /^[A-Z_]+$/.test(failure.message) ? failure.message : "CALENDAR_SYNC_FAILED";
      state = failure instanceof CalendarFailure && failure.retrySafe && job.attempts < 10 ? "queued" : "needs_attention";
    }
    // If this write fails, leave the lease. Its expiry goes to manual review,
    // never to an automatic duplicate invitation.
    const finished = await admin.rpc("finish_cleaner_calendar", { p_cleaner_id: job.cleaner_id,
      p_claim_token: job.claim_token, p_version: job.source_version, p_state: state,
      p_calendar_uid: job.calendar_uid ?? config.uid, p_event_uid: eventUid, p_error: error });
    if (finished.error || finished.data !== true) throw new Error("CALENDAR_RESULT_NOT_SAVED");
    processed++;
  }
  return { enabled: true, processed };
}
