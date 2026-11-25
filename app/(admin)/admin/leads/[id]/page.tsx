import { canSeeLeadSource } from "@/lib/admin/access";
import { requireAdminArea } from "@/lib/admin/page-access";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LeadActions } from "@/components/admin/lead-actions";
import { formatWhen, LeadStatusBadge } from "@/components/admin/leads-table";
import { JOURNEYS, type JourneyId } from "@/lib/outreach/journeys";
import { currentConsents, getLead, leadName } from "@/lib/outreach/leads";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Lead" };
export const dynamic = "force-dynamic";

type TimelineItem = {
  at: string;
  body?: string | null;
  kind: "event" | "message" | "call";
  title: string;
  tone?: "in" | "out" | "muted" | "warn";
  link?: string | null;
};

export default async function AdminLeadPage({ params }: { params: { id: string } }) {
  const access = await requireAdminArea("leads");
  const lead = await getLead(params.id);
  if (!lead || !canSeeLeadSource(access, lead.source)) notFound();
  const admin = createAdminClient();

  const [consents, events, messages, calls, enrollments] = await Promise.all([
    currentConsents(lead.id),
    admin.from("lead_events").select("id,type,summary,payload,created_at").eq("lead_id", lead.id).order("created_at", { ascending: false }).limit(200),
    admin.from("outreach_messages").select("id,channel,direction,status,subject,body,ai_generated,ai_intent,error,created_at").eq("lead_id", lead.id).order("created_at", { ascending: false }).limit(200),
    admin.from("outreach_calls").select("id,purpose,status,outcome,summary,transcript,recording_url,duration_seconds,ended_reason,error,created_at").eq("lead_id", lead.id).order("created_at", { ascending: false }),
    admin.from("outreach_enrollments").select("id,journey,step_index,status,stop_reason,next_run_at,created_at").eq("lead_id", lead.id).order("created_at", { ascending: false }),
  ]);

  const sentDraftIds = new Set(
    (events.data ?? [])
      .filter((e) => e.type === "ai.draft_sent")
      .map((e) => String((e.payload as { eventId?: string } | null)?.eventId ?? "")),
  );
  // A draft is stale once anything was sent to the lead after it.
  const lastSent = (messages.data ?? []).find((m) => m.direction === "outbound" && m.status === "sent")?.created_at ?? "";
  const drafts = (events.data ?? [])
    .filter((e) => e.type === "ai.draft" && String(e.created_at) > String(lastSent))
    .map((e) => {
      const payload = (e.payload ?? {}) as { channel?: string; reply?: string; subject?: string | null };
      return { channel: payload.channel ?? "email", eventId: e.id as string, reply: payload.reply ?? "", subject: payload.subject ?? null };
    })
    .filter((draft) => draft.reply && !sentDraftIds.has(draft.eventId));

  const timeline: TimelineItem[] = [
    ...(events.data ?? [])
      .filter((e) => !["ai.draft"].includes(String(e.type)))
      .map((e) => ({
        at: e.created_at as string,
        kind: "event" as const,
        title: e.summary as string,
        tone: (String(e.type).includes("handover") || String(e.type).includes("opt_out") ? "warn" : "muted") as TimelineItem["tone"],
      })),
    ...(messages.data ?? []).map((m) => ({
      at: m.created_at as string,
      body: m.body as string,
      kind: "message" as const,
      title:
        m.direction === "inbound"
          ? `${m.channel === "sms" ? "Text" : "Email"} from lead${m.ai_intent ? ` · AI read it as "${m.ai_intent}"` : ""}`
          : `${m.channel === "sms" ? "Text" : "Email"} ${m.status}${m.ai_generated ? " · written by AI" : ""}${m.subject ? ` · ${m.subject}` : ""}${m.error ? ` · ${m.error}` : ""}`,
      tone: (m.direction === "inbound" ? "in" : m.status === "sent" ? "out" : "muted") as TimelineItem["tone"],
    })),
    ...(calls.data ?? []).map((c) => ({
      at: c.created_at as string,
      body: [c.summary, c.transcript ? `Transcript:\n${c.transcript}` : null].filter(Boolean).join("\n\n") || null,
      kind: "call" as const,
      link: (c.recording_url as string | null) ?? null,
      title: `AI call · ${c.status}${c.outcome ? ` · ${c.outcome}` : ""}${c.duration_seconds ? ` · ${Math.round(Number(c.duration_seconds) / 60 * 10) / 10} min` : ""}${c.error ? ` · ${c.error}` : ""}`,
      tone: "out" as const,
    })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1));

  const runningJourneys = new Set(
    (enrollments.data ?? []).filter((e) => e.status === "active").map((e) => e.journey as string),
  );

  return (
    <div className="min-w-0 space-y-5">
      <Link className="text-sm font-semibold text-[#312c79] hover:underline" href="/admin/leads">
        ← All leads
      </Link>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-5">
          <section className="rounded-xl border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#1c133b]">
                  {leadName(lead) || lead.email || lead.phone}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[lead.email, lead.phone].filter(Boolean).join(" · ")}
                </p>
              </div>
              <LeadStatusBadge status={lead.status} />
            </div>
            {lead.needs_human ? (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
                Needs a person: {lead.needs_human_reason ?? "see timeline"}
              </p>
            ) : null}
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <Row label="Source" value={[lead.source, lead.utm_source, lead.utm_campaign].filter(Boolean).join(" / ")} />
              <Row label="Created" value={formatWhen(lead.created_at)} />
              <Row label="Callback requested" value={formatWhen(lead.callback_requested_at)} />
              <Row label="Booked" value={lead.booking_id ? formatWhen(lead.booked_at) : "–"} link={lead.booking_id ? `/admin/booking/${lead.booking_id}` : undefined} />
              <Row label="Automation" value={lead.do_not_contact ? "Do not contact" : lead.automation_paused ? "Paused" : "On"} />
              <Row
                label="Consent"
                value={(["email", "sms", "call"] as const)
                  .map((channel) => `${channel === "sms" ? "text" : channel}: ${consents[channel]?.granted ? `yes (${consents[channel]!.basis.replace("_", " ")})` : "no"}`)
                  .join(" · ")}
              />
            </dl>
          </section>

          {(enrollments.data ?? []).length ? (
            <section className="rounded-xl border bg-card p-5">
              <h2 className="text-sm font-semibold text-[#1c133b]">Journeys</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {(enrollments.data ?? []).map((e) => {
                  const def = JOURNEYS[e.journey as JourneyId];
                  const step = def?.steps[Number(e.step_index)];
                  return (
                    <li className="flex flex-wrap justify-between gap-2" key={e.id as string}>
                      <span className="font-medium">{def?.label ?? e.journey}</span>
                      <span className="text-muted-foreground">
                        {e.status === "active"
                          ? `Next: ${step?.name ?? "finishing"} · ${formatWhen(e.next_run_at as string)}`
                          : `${e.status}${e.stop_reason ? ` (${String(e.stop_reason).replaceAll("_", " ")})` : ""}`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-sm font-semibold text-[#1c133b]">Timeline</h2>
            <ol className="mt-4 space-y-4">
              {timeline.map((item, index) => (
                <li className="border-l-2 pl-4" key={`${item.kind}-${index}`} style={{ borderColor: item.tone === "in" ? "#6a45b8" : item.tone === "warn" ? "#d97706" : item.tone === "out" ? "#c79c66" : "#e6e0f2" }}>
                  <p className="text-xs text-muted-foreground">{formatWhen(item.at)}</p>
                  <p className="text-sm font-medium text-[#1c133b]">{item.title}</p>
                  {item.body ? (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-xs text-[#312c79]">Show text</summary>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-[#4a4460]">{item.body}</p>
                    </details>
                  ) : null}
                  {item.link ? (
                    <a className="text-xs font-semibold text-[#312c79] hover:underline" href={item.link} rel="noreferrer" target="_blank">
                      Recording
                    </a>
                  ) : null}
                </li>
              ))}
              {!timeline.length ? <li className="text-sm text-muted-foreground">Nothing yet.</li> : null}
            </ol>
          </section>
        </div>

        <aside className="min-w-0">
          <LeadActions
            automationPaused={lead.automation_paused}
            canEmail={Boolean(lead.email)}
            canText={Boolean(lead.phone)}
            drafts={drafts}
            journeys={(Object.keys(JOURNEYS) as JourneyId[])
              .filter((id) => !runningJourneys.has(id))
              .map((id) => ({ id, label: JOURNEYS[id].label }))}
            leadId={lead.id}
            needsHuman={lead.needs_human}
            notes={lead.notes ?? ""}
            status={lead.status}
          />
        </aside>
      </div>
    </div>
  );
}

function Row({ label, link, value }: { label: string; link?: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words">
        {link ? (
          <Link className="font-medium text-[#312c79] hover:underline" href={link}>
            {value}
          </Link>
        ) : (
          value || "–"
        )}
      </dd>
    </div>
  );
}
