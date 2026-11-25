import Link from "next/link";

import { LeadsTable, type LeadListRow } from "@/components/admin/leads-table";
import {
  aiConfigured,
  aiReplyMode,
  callsConfigured,
  emailConfigured,
  outreachEnabled,
  smsConfigured,
} from "@/lib/outreach/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";

export const metadata = { title: "Leads" };
export const dynamic = "force-dynamic";

const VIEWS = [
  { id: "all", label: "All" },
  { id: "needs_human", label: "Needs a person" },
  { id: "active", label: "In follow-up" },
  { id: "booked", label: "Booked" },
  { id: "lost", label: "Lost / unsubscribed" },
] as const;

export default async function AdminLeadsPage({ searchParams }: { searchParams: { view?: string } }) {
  const view = VIEWS.some((item) => item.id === searchParams.view) ? searchParams.view! : "all";
  const admin = createAdminClient();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  let query = admin
    .from("leads")
    .select(
      "id,email,phone,first_name,last_name,status,source,utm_source,utm_campaign,needs_human,needs_human_reason,callback_requested_at,last_inbound_at,last_outbound_at,created_at,updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(500);
  if (view === "needs_human") query = query.eq("needs_human", true);
  if (view === "active") query = query.in("status", ["new", "contacted", "engaged"]);
  if (view === "booked") query = query.eq("status", "booked");
  if (view === "lost") query = query.in("status", ["lost", "unsubscribed"]);

  const [{ data, error }, newWeek, bookedWeek, waiting, calls] = await Promise.all([
    query,
    admin.from("leads").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
    admin.from("leads").select("id", { count: "exact", head: true }).gte("booked_at", weekAgo),
    admin.from("leads").select("id", { count: "exact", head: true }).eq("needs_human", true),
    admin.from("outreach_calls").select("id", { count: "exact", head: true }).gte("created_at", weekAgo).neq("status", "failed"),
  ]);

  const rows: LeadListRow[] = (data ?? []).map((row) => ({
    callback_requested_at: (row.callback_requested_at as string | null) ?? null,
    created_at: row.created_at as string,
    email: (row.email as string | null) ?? null,
    id: row.id as string,
    last_activity: [row.last_inbound_at, row.last_outbound_at, row.updated_at]
      .filter(Boolean)
      .sort()
      .reverse()[0] as string,
    name: [row.first_name, row.last_name].filter(Boolean).join(" "),
    needs_human: Boolean(row.needs_human),
    needs_human_reason: (row.needs_human_reason as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    source: row.source as string,
    status: row.status as string,
    utm: [row.utm_source, row.utm_campaign].filter(Boolean).join(" / "),
  }));

  const services = [
    { label: "Automation", ok: outreachEnabled(), off: "Off: set OUTREACH_ENABLED=true" },
    { label: "Email", ok: emailConfigured(), off: "RESEND_API_KEY missing" },
    { label: "Texts", ok: smsConfigured(), off: "Twilio keys missing" },
    { label: `AI replies (${aiReplyMode()})`, ok: aiConfigured(), off: "ANTHROPIC_API_KEY missing" },
    { label: "AI calls", ok: callsConfigured(), off: "Vapi keys missing" },
  ];
  const tiles = [
    { label: "New leads (7 days)", value: newWeek.count ?? 0 },
    { label: "Booked (7 days)", value: bookedWeek.count ?? 0 },
    { label: "Waiting for a person", value: waiting.count ?? 0 },
    { label: "AI calls (7 days)", value: calls.count ?? 0 },
  ];

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {services.map((service) => (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1",
              service.ok ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-slate-100 text-slate-600 ring-slate-200",
            )}
            key={service.label}
            title={service.ok ? "Ready" : service.off}
          >
            <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", service.ok ? "bg-emerald-500" : "bg-slate-400")} />
            {service.label}
            {service.ok ? "" : ": off"}
          </span>
        ))}
        <Link className="ml-auto text-sm font-semibold text-[#312c79] hover:underline" href="/admin/leads/reports">
          Weekly reports
        </Link>
        <Link
          className="inline-flex h-9 items-center rounded-full bg-[#1c133b] px-4 text-sm font-semibold text-white hover:bg-[#312c79]"
          href="/admin/leads/new"
        >
          Add lead
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div className="rounded-xl border bg-card px-4 py-3" key={tile.label}>
            <p className="text-xs font-medium text-muted-foreground">{tile.label}</p>
            <p className="mt-1 text-2xl font-semibold text-[#1c133b]">{tile.value}</p>
          </div>
        ))}
      </div>

      <nav aria-label="Lead views" className="flex flex-wrap gap-2">
        {VIEWS.map((item) => (
          <Link
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold",
              view === item.id ? "bg-[#1c133b] text-white" : "border bg-card text-[#1c133b] hover:bg-[#f7f5fb]",
            )}
            href={`/admin/leads?view=${item.id}`}
            key={item.id}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {error ? (
        <p className="text-sm text-[#9a3412]">
          Leads could not be loaded. Apply migration 20261118100000_lead_automation.sql and refresh.
        </p>
      ) : (
        <LeadsTable resetKey={view} rows={rows} />
      )}
    </div>
  );
}
