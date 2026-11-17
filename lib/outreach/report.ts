import { sendBrandedEmail } from "@/lib/email/send-email";
import { writeWeeklySummary } from "@/lib/outreach/ai";
import { appUrl } from "@/lib/outreach/config";
import { createAdminClient } from "@/lib/supabase/admin";

const DAY = 24 * 60 * 60 * 1000;

function countBy<T>(rows: T[], key: (row: T) => string) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const k = key(row) || "unknown";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
}

export async function computeMetrics(start: Date, end: Date) {
  const admin = createAdminClient();
  const from = start.toISOString();
  const to = end.toISOString();

  const [leads, messages, calls, booked, optOuts, waiting] = await Promise.all([
    admin.from("leads").select("id,source,status").gte("created_at", from).lt("created_at", to),
    admin
      .from("outreach_messages")
      .select("lead_id,channel,direction,status,error,ai_generated,ai_intent")
      .gte("created_at", from)
      .lt("created_at", to),
    admin.from("outreach_calls").select("lead_id,status,outcome,duration_seconds").gte("created_at", from).lt("created_at", to),
    admin.from("leads").select("id,source,attributed_message_id").gte("booked_at", from).lt("booked_at", to),
    admin.from("lead_consents").select("channel").eq("granted", false).gte("captured_at", from).lt("captured_at", to),
    admin.from("leads").select("id", { count: "exact", head: true }).eq("needs_human", true),
  ]);

  const msgs = messages.data ?? [];
  const outbound = msgs.filter((m) => m.direction === "outbound");
  const inbound = msgs.filter((m) => m.direction === "inbound");
  const callRows = calls.data ?? [];
  const leadRows = leads.data ?? [];
  const bookedRows = booked.data ?? [];
  const connected = callRows.filter((c) => c.outcome && !["not_connected", "voicemail", "no_conversation"].includes(String(c.outcome)));

  return {
    ai_auto_replies: outbound.filter((m) => m.ai_generated && m.status === "sent").length,
    bookings_won: bookedRows.length,
    bookings_won_after_outreach: bookedRows.filter((b) => b.attributed_message_id).length,
    bookings_won_by_source: countBy(bookedRows, (b) => String(b.source)),
    calls_connected: connected.length,
    calls_failed: callRows.filter((c) => c.status === "failed").length,
    calls_minutes: Math.round(callRows.reduce((sum, c) => sum + Number(c.duration_seconds ?? 0), 0) / 60),
    calls_outcomes: countBy(callRows, (c) => String(c.outcome ?? c.status)),
    calls_placed: callRows.filter((c) => c.status !== "failed").length,
    conversion_rate_percent: leadRows.length ? Math.round((bookedRows.length / leadRows.length) * 1000) / 10 : 0,
    leads_new: leadRows.length,
    leads_new_by_source: countBy(leadRows, (l) => String(l.source)),
    leads_waiting_for_a_person_now: waiting.count ?? 0,
    messages_failed: outbound.filter((m) => m.status === "failed").length,
    messages_sent_by_channel: countBy(outbound.filter((m) => m.status === "sent"), (m) => String(m.channel)),
    messages_skipped_reasons: countBy(outbound.filter((m) => m.status === "skipped"), (m) => String(m.error)),
    opt_outs_by_channel: countBy(optOuts.data ?? [], (o) => String(o.channel)),
    period: { end: to, start: from },
    replies_by_intent: countBy(inbound, (m) => String(m.ai_intent ?? "unclassified")),
    replies_received: inbound.length,
  };
}

/** Build, store and email last week's report. Idempotent per period start. */
export async function generateWeeklyReport(now = new Date()) {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(end.getTime() - 7 * DAY);
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("outreach_reports")
    .select("id")
    .eq("period_start", start.toISOString())
    .maybeSingle();
  if (existing) return { skipped: "already generated", id: existing.id as string };

  const current = await computeMetrics(start, end);
  const previous = await computeMetrics(new Date(start.getTime() - 7 * DAY), start);
  const metrics = {
    ...current,
    previous_week: {
      bookings_won: previous.bookings_won,
      calls_connected: previous.calls_connected,
      leads_new: previous.leads_new,
      replies_received: previous.replies_received,
    },
  };

  const summary =
    (await writeWeeklySummary(metrics)) ??
    [
      `${current.leads_new} new leads and ${current.bookings_won} bookings won (${current.conversion_rate_percent}% conversion). The week before: ${previous.leads_new} leads, ${previous.bookings_won} bookings.`,
      `Messages sent: ${JSON.stringify(current.messages_sent_by_channel)}. AI calls: ${current.calls_placed} placed, ${current.calls_connected} connected. Replies: ${current.replies_received}.`,
      `${current.leads_waiting_for_a_person_now} leads are waiting for a person in Admin › Leads.`,
    ].join("\n\n");

  const { data: row } = await admin
    .from("outreach_reports")
    .insert({ metrics, period_end: end.toISOString(), period_start: start.toISOString(), summary })
    .select("id")
    .single();

  const { data: admins } = await admin.from("profiles").select("email").eq("role", "admin");
  const recipients = [
    ...(admins ?? []).map((a) => String(a.email ?? "")),
    ...(process.env.OUTREACH_REPORT_EMAILS ?? "").split(","),
  ]
    .map((e) => e.trim())
    .filter(Boolean);
  const range = `${start.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} to ${new Date(end.getTime() - DAY).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
  if (recipients.length) {
    await sendBrandedEmail({
      data: {
        actionLabel: "Open the full report",
        actionUrl: `${appUrl()}/admin/leads/reports`,
        body: summary,
        "Bookings won": current.bookings_won,
        "New leads": current.leads_new,
        "Waiting for a person": current.leads_waiting_for_a_person_now,
        title: `Lead report: ${range}`,
        tone: "admin",
      },
      subject: `Mundoria lead report: ${range}`,
      template: "system.generic",
      to: Array.from(new Set(recipients)),
    });
  }
  return { id: row?.id as string | undefined, metrics };
}
