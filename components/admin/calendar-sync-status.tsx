import { createAdminClient } from "@/lib/supabase/admin";

const LABELS: Record<string, string> = {
  queued: "Calendar confirmation queued",
  sending: "Calendar confirmation in progress",
  synced: "Appointment saved in Zoho Calendar",
  cancelled: "Calendar appointment cancelled",
  needs_attention: "Calendar confirmation needs attention",
};

export async function CalendarSyncStatus({ cleanerId }: { cleanerId: string }) {
  if (process.env.ZOHO_CALENDAR_ENABLED !== "true") return null;
  const { data, error } = await createAdminClient().from("zoho_cleaner_calendar")
    .select("state,last_error,synced_at").eq("cleaner_id", cleanerId).maybeSingle();
  const label = error ? "Calendar status unavailable" : data ? LABELS[data.state] : "No calendar handoff recorded";
  return <section className="rounded-2xl border bg-white p-4" aria-label="Calendar confirmation">
    <h2 className="font-semibold">{label}</h2>
    <p className="mt-1 text-sm text-muted-foreground">
      {data?.state === "synced"
        ? "Zoho accepted the appointment and the request to notify attendees. This does not confirm email delivery or attendance."
        : data?.state === "needs_attention"
          ? "Check the Recruitment calendar before retrying. An invitation may already exist."
          : "The appointment time and the calendar confirmation are tracked separately."}
    </p>
    {data?.last_error && <p className="mt-2 text-xs text-muted-foreground">Reference: {data.last_error}</p>}
  </section>;
}
