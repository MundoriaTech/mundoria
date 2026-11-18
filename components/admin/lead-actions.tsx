"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Draft = { channel: string; eventId: string; reply: string; subject: string | null };

const STATUSES = ["new", "contacted", "engaged", "booked", "lost"] as const;

export function LeadActions({
  automationPaused,
  canEmail,
  canText,
  drafts,
  journeys,
  leadId,
  needsHuman,
  notes,
  status,
}: {
  automationPaused: boolean;
  canEmail: boolean;
  canText: boolean;
  drafts: Draft[];
  journeys: Array<{ id: string; label: string }>;
  leadId: string;
  needsHuman: boolean;
  notes: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const [channel, setChannel] = useState<"email" | "sms">(canEmail ? "email" : "sms");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [noteText, setNoteText] = useState(notes);
  const [draftEdits, setDraftEdits] = useState<Record<string, string>>(
    Object.fromEntries(drafts.map((draft) => [draft.eventId, draft.reply])),
  );

  async function call(method: "PATCH" | "POST", payload: Record<string, unknown>, key: string, ok: string) {
    setBusy(key);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method,
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setMessage({ kind: "error", text: result.error ?? "That didn't work." });
        return false;
      }
      setMessage({ kind: "ok", text: ok });
      router.refresh();
      return true;
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      {message ? (
        <p
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            message.kind === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800",
          )}
          role="status"
        >
          {message.text}
        </p>
      ) : null}

      {drafts.length ? (
        <section className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <h2 className="text-sm font-semibold text-[#1c133b]">AI drafts waiting for approval</h2>
          {drafts.map((draft) => (
            <div className="space-y-2" key={draft.eventId}>
              <p className="text-xs text-muted-foreground">
                {draft.channel === "sms" ? "Text" : "Email"} reply{draft.subject ? ` to "${draft.subject}"` : ""}
              </p>
              <textarea
                className="min-h-28 w-full rounded-lg border bg-white p-3 text-sm"
                onChange={(event) => setDraftEdits((current) => ({ ...current, [draft.eventId]: event.target.value }))}
                value={draftEdits[draft.eventId] ?? ""}
              />
              <Button
                disabled={busy !== null || !(draftEdits[draft.eventId] ?? "").trim()}
                onClick={() =>
                  void call(
                    "POST",
                    { action: "approve_draft", eventId: draft.eventId, reply: draftEdits[draft.eventId] },
                    `draft-${draft.eventId}`,
                    "Reply sent.",
                  )
                }
                size="sm"
                type="button"
              >
                {busy === `draft-${draft.eventId}` ? "Sending…" : "Send this reply"}
              </Button>
            </div>
          ))}
        </section>
      ) : null}

      <section className="space-y-3 rounded-xl border bg-card p-4">
        <h2 className="text-sm font-semibold text-[#1c133b]">Status</h2>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((item) => (
            <button
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold capitalize",
                status === item ? "bg-[#1c133b] text-white" : "border bg-white text-[#1c133b] hover:bg-[#f7f5fb]",
              )}
              disabled={busy !== null || status === item}
              key={item}
              onClick={() => void call("PATCH", { status: item }, "status", `Marked ${item}.`)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {needsHuman ? (
            <Button
              disabled={busy !== null}
              onClick={() => void call("PATCH", { needsHuman: false }, "resolve", "Marked as handled.")}
              size="sm"
              type="button"
            >
              Mark handled
            </Button>
          ) : null}
          <Button
            disabled={busy !== null}
            onClick={() =>
              void call(
                "PATCH",
                { automationPaused: !automationPaused },
                "pause",
                automationPaused ? "Automation resumed." : "Automation paused.",
              )
            }
            size="sm"
            type="button"
            variant="outline"
          >
            {automationPaused ? "Resume automation" : "Pause automation"}
          </Button>
          <Button
            disabled={busy !== null}
            onClick={() => void call("POST", { action: "call_now" }, "call", "AI call placed.")}
            size="sm"
            type="button"
            variant="outline"
          >
            {busy === "call" ? "Calling…" : "AI call now"}
          </Button>
          <Button
            disabled={busy !== null}
            onClick={() => void call("POST", { action: "stop_journeys" }, "stop", "Follow-ups stopped.")}
            size="sm"
            type="button"
            variant="outline"
          >
            Stop follow-ups
          </Button>
        </div>
        {journeys.length ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground">Start journey:</span>
            {journeys.map((journey) => (
              <button
                className="rounded-full border bg-white px-3 py-1 text-xs font-semibold text-[#312c79] hover:bg-[#f7f5fb]"
                disabled={busy !== null}
                key={journey.id}
                onClick={() =>
                  void call("POST", { action: "start_journey", journey: journey.id }, "journey", `Started "${journey.label}".`)
                }
                type="button"
              >
                {journey.label}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section className="space-y-3 rounded-xl border bg-card p-4">
        <h2 className="text-sm font-semibold text-[#1c133b]">Send a message</h2>
        <div className="flex gap-2">
          {(["email", "sms"] as const).map((item) => (
            <button
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold",
                channel === item ? "bg-[#1c133b] text-white" : "border bg-white text-[#1c133b]",
              )}
              disabled={item === "email" ? !canEmail : !canText}
              key={item}
              onClick={() => setChannel(item)}
              type="button"
            >
              {item === "email" ? "Email" : "Text"}
            </button>
          ))}
        </div>
        {channel === "email" ? (
          <input
            className="h-10 w-full rounded-lg border px-3 text-sm"
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Subject"
            value={subject}
          />
        ) : null}
        <textarea
          className="min-h-28 w-full rounded-lg border p-3 text-sm"
          onChange={(event) => setBody(event.target.value)}
          placeholder={channel === "sms" ? "Text message (keep it short)" : "Message"}
          value={body}
        />
        <Button
          disabled={busy !== null || !body.trim()}
          onClick={async () => {
            const sent = await call("POST", { action: "send_message", body, channel, subject }, "send", "Message sent.");
            if (sent) {
              setBody("");
              setSubject("");
            }
          }}
          size="sm"
          type="button"
        >
          {busy === "send" ? "Sending…" : "Send"}
        </Button>
      </section>

      <section className="space-y-3 rounded-xl border bg-card p-4">
        <h2 className="text-sm font-semibold text-[#1c133b]">Notes</h2>
        <textarea
          className="min-h-24 w-full rounded-lg border p-3 text-sm"
          onChange={(event) => setNoteText(event.target.value)}
          value={noteText}
        />
        <Button
          disabled={busy !== null || noteText === notes}
          onClick={() => void call("PATCH", { notes: noteText }, "notes", "Notes saved.")}
          size="sm"
          type="button"
          variant="outline"
        >
          Save notes
        </Button>
      </section>
    </div>
  );
}
