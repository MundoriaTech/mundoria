import Link from "next/link";

import { DetailSection } from "@/components/admin/detail-section";
import { humanize, ukDateTime } from "@/lib/admin/format";
import { toE164 } from "@/lib/outreach/config";
import { createAdminClient } from "@/lib/supabase/admin";

const linkClass = "font-medium text-[#524096] hover:underline";

/**
 * Everything else Mundoria knows about the person behind one callback
 * request: their other requests, the lead record (status, consent, AI
 * activity), their account and bookings, and whether Zoho has the request.
 * The desk itself only edits the call outcome.
 */
export async function CallbackLeadContext({ callbackId }: { callbackId: string }) {
  const admin = createAdminClient();
  const { data: callback } = await admin
    .from("callback_leads")
    .select("id,email,phone,user_agent,offer_redeemed_booking_id,offer_redeemed_at,created_at")
    .eq("id", callbackId)
    .maybeSingle();
  if (!callback) return null;

  const email = String(callback.email ?? "").toLowerCase();
  const phone = toE164(String(callback.phone ?? ""));

  const [{ data: byEmail }, { data: leadByEmail }, { data: account }] = await Promise.all([
    admin
      .from("callback_leads")
      .select("id,source,created_at,call_status,outcome,phone")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("leads")
      .select("id,status,source,utm_source,utm_medium,utm_campaign,do_not_contact,automation_paused,created_at,booking_id")
      .eq("email", email)
      .maybeSingle(),
    admin.from("profiles").select("id,role,full_name").eq("email", email).maybeSingle(),
  ]);
  let lead = leadByEmail;
  if (!lead && phone) {
    const { data } = await admin
      .from("leads")
      .select("id,status,source,utm_source,utm_medium,utm_campaign,do_not_contact,automation_paused,created_at,booking_id")
      .eq("phone", phone)
      .maybeSingle();
    lead = data;
  }

  const [consents, calls, messages, zoho, bookings] = await Promise.all([
    lead
      ? admin
          .from("lead_consents")
          .select("channel,granted,basis,wording,source_page,captured_at")
          .eq("lead_id", lead.id)
          .order("captured_at", { ascending: false })
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    lead
      ? admin.from("outreach_calls").select("status,outcome,created_at").eq("lead_id", lead.id).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    lead
      ? admin.from("outreach_messages").select("channel,direction,status,created_at").eq("lead_id", lead.id).order("created_at", { ascending: false }).limit(50)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    lead
      ? admin.from("zoho_sales_intake").select("zoho_lead_id,completed_at,last_error,attempts").eq("lead_id", lead.id).maybeSingle()
      : Promise.resolve({ data: null }),
    account
      ? admin.from("bookings").select("id,status,scheduled_date,created_at").eq("customer_id", account.id).order("created_at", { ascending: false }).limit(5)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
  ]);

  const others = (byEmail ?? []).filter((row) => row.id !== callbackId);
  const latestConsent = new Map<string, Record<string, unknown>>();
  for (const row of (consents.data ?? []) as Array<Record<string, unknown>>) {
    const channel = String(row.channel);
    if (!latestConsent.has(channel)) latestConsent.set(channel, row);
  }
  const lastCall = ((calls.data ?? []) as Array<Record<string, unknown>>)[0];
  const sentMessages = ((messages.data ?? []) as Array<Record<string, unknown>>).filter((m) => m.direction === "outbound" && m.status === "sent");
  const replies = ((messages.data ?? []) as Array<Record<string, unknown>>).filter((m) => m.direction === "inbound");
  const zohoRow = zoho.data as { attempts?: number; completed_at?: string | null; last_error?: string | null; zoho_lead_id?: string | null } | null;

  return (
    <DetailSection
      description="Everything else we know about this person, from the lead record, their account and Zoho."
      rows={[
        {
          label: "Lead record",
          value: lead ? (
            <Link className={linkClass} href={`/admin/leads/${lead.id}`}>
              {humanize(lead.status)}
              {lead.do_not_contact ? " · do not contact" : lead.automation_paused ? " · automation paused" : ""}
            </Link>
          ) : "None found",
        },
        {
          label: "First came from",
          value: lead
            ? [lead.source, lead.utm_source, lead.utm_medium, lead.utm_campaign].filter(Boolean).join(" / ") +
              ` (${ukDateTime(lead.created_at)})`
            : null,
        },
        {
          label: "Other requests from this email",
          value: others.length
            ? others.map((row) => (
                <span className="block" key={row.id}>
                  <Link className={linkClass} href={`/admin/callback-leads/${row.id}`}>
                    {ukDateTime(row.created_at)} · {row.source}
                  </Link>{" "}
                  ({humanize(row.call_status)}{row.outcome ? `, ${humanize(row.outcome)}` : ""})
                </span>
              ))
            : "None",
          wide: true,
        },
        {
          label: "Consent on record",
          value: latestConsent.size
            ? Array.from(latestConsent.values()).map((row) => (
                <span className="block" key={String(row.channel)}>
                  {String(row.channel) === "sms" ? "Text" : humanize(String(row.channel))}:{" "}
                  {row.granted ? "yes" : "no"} ({humanize(String(row.basis))}, {ukDateTime(String(row.captured_at))}
                  {row.source_page ? `, ${row.source_page}` : ""})
                  {row.wording ? <span className="block text-xs text-muted-foreground">“{String(row.wording)}”</span> : null}
                </span>
              ))
            : "None recorded",
          wide: true,
        },
        {
          label: "Automated follow-up",
          value: lead
            ? `${sentMessages.length} message${sentMessages.length === 1 ? "" : "s"} sent · ${replies.length} repl${replies.length === 1 ? "y" : "ies"} · ${
                ((calls.data ?? []) as unknown[]).length
              } AI call${((calls.data ?? []) as unknown[]).length === 1 ? "" : "s"}${
                lastCall ? ` (last: ${humanize(String(lastCall.status))}${lastCall.outcome ? `, ${String(lastCall.outcome)}` : ""})` : ""
              }`
            : null,
        },
        {
          label: "Zoho",
          value: !zohoRow
            ? "Not queued (Zoho off, a test address, or sent before the queue existed)"
            : zohoRow.completed_at
              ? zohoRow.last_error === "SUPPRESSED"
                ? "Skipped (opted out or test address)"
                : `In Zoho${zohoRow.zoho_lead_id ? ` (lead ${zohoRow.zoho_lead_id})` : ""} · ${ukDateTime(zohoRow.completed_at)}`
              : `Waiting to send (${zohoRow.attempts ?? 0} tries${zohoRow.last_error ? `, last error: ${zohoRow.last_error}` : ""})`,
        },
        {
          label: "Account",
          value: account ? (
            <Link className={linkClass} href={account.role === "cleaner" ? `/admin/cleaners/${account.id}` : `/admin/customer/${account.id}`}>
              {account.full_name ?? "Account"} ({account.role})
            </Link>
          ) : "No account with this email",
        },
        {
          label: "Bookings",
          value: ((bookings.data ?? []) as Array<Record<string, unknown>>).length
            ? ((bookings.data ?? []) as Array<Record<string, unknown>>).map((row) => (
                <span className="block" key={String(row.id)}>
                  <Link className={linkClass} href={`/admin/booking/${String(row.id)}`}>
                    {String(row.scheduled_date)} · {humanize(String(row.status))}
                  </Link>
                </span>
              ))
            : "None",
        },
        {
          label: "Offer used on",
          value: callback.offer_redeemed_booking_id ? (
            <Link className={linkClass} href={`/admin/booking/${callback.offer_redeemed_booking_id}`}>
              Booking {String(callback.offer_redeemed_booking_id).slice(0, 8)} · {ukDateTime(callback.offer_redeemed_at)}
            </Link>
          ) : "Not used yet",
        },
        { label: "Device", value: callback.user_agent ? String(callback.user_agent) : null, wide: true },
      ]}
      title="About this person"
    />
  );
}
