"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useFeedback } from "@/components/shared/feedback-provider";
import { Button } from "@/components/ui/button";

const STATUSES = [
  { label: "Submitted", value: "submitted" },
  { label: "Under review", value: "under_review" },
  { label: "Action required", value: "action_required" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
] as const;

export function IncidentActions({
  adminNotes,
  incidentId,
  riddorRequired,
  status,
}: {
  adminNotes: string | null;
  incidentId: string;
  riddorRequired: boolean;
  status: string;
}) {
  const router = useRouter();
  const { error: showError, success } = useFeedback();
  const [nextStatus, setNextStatus] = useState(status);
  const [notes, setNotes] = useState(adminNotes ?? "");
  const [riddor, setRiddor] = useState(riddorRequired);
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    try {
      const response = await fetch(`/api/admin/incidents/${incidentId}`, {
        body: JSON.stringify({
          admin_notes: notes,
          riddor_required: riddor,
          status: nextStatus,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        showError({
          description: result.error ?? "Try again.",
          title: "Couldn’t update this incident",
        });
        return;
      }
      success({ kind: "done", note: "Ops record saved.", title: "Incident updated" });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-semibold">Triage</h2>
      <label className="mt-4 block text-sm font-medium" htmlFor="incident-status">
        Status
      </label>
      <select
        className="mt-1 h-11 w-full rounded-md border bg-white px-3 text-sm"
        id="incident-status"
        onChange={(event) => setNextStatus(event.target.value)}
        value={nextStatus}
      >
        {STATUSES.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <label className="mt-4 block text-sm font-medium" htmlFor="incident-notes">
        Admin notes
      </label>
      <textarea
        className="mt-1 min-h-28 w-full rounded-md border p-3 text-sm"
        id="incident-notes"
        maxLength={4000}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Internal notes, follow-up, outcome…"
        value={notes}
      />

      <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm">
        <input
          checked={riddor}
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-brand-ink"
          onChange={(event) => setRiddor(event.target.checked)}
          type="checkbox"
        />
        <span>
          <b>RIDDOR reportable</b>
          <span className="block text-muted-foreground">
            Tick if this must be reported to the HSE (work-related death,
            specified injury, over-7-day incapacitation, dangerous occurrence).
          </span>
        </span>
      </label>

      <Button
        className="mt-5 min-h-11 w-full"
        loading={pending}
        loadingLabel="Saving…"
        onClick={() => void save()}
      >
        Save changes
      </Button>
    </section>
  );
}
