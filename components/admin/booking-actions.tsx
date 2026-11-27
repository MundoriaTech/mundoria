"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ActionError } from "@/components/shared/action-error";
import { useFeedback } from "@/components/shared/feedback-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoundCheckbox } from "@/components/ui/round-checkbox";
import { SimpleSelect } from "@/components/ui/select";

type BookingAction =
  | "reassign"
  | "status"
  | "rematch"
  | "assignTeam"
  | "approve_checkin"
  | "approve_checkout";

export function BookingActions({
  allocatedCleaners = 1,
  bookingId,
  checkinOverrideRequested = false,
  checkoutOverrideRequested = false,
  cleaners,
  currentStatus,
  teamMemberIds = [],
}: {
  allocatedCleaners?: number;
  bookingId: string;
  checkinOverrideRequested?: boolean;
  checkoutOverrideRequested?: boolean;
  cleaners: { id: string; full_name: string }[];
  currentStatus: string;
  teamMemberIds?: string[];
}) {
  const router = useRouter();
  const { confirm, success } = useFeedback();
  const [cleanerId, setCleanerId] = useState("");
  const [teamIds, setTeamIds] = useState<string[]>(teamMemberIds);
  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const needsTeam = allocatedCleaners > 1;

  async function act(action: BookingAction) {
    if (action === "rematch") {
      const ok = await confirm({
        action: "Find replacement",
        description:
          "This will kick off a rematch for the booking. Make sure the audit note explains why.",
        title: "Find a replacement cleaner?",
        variant: "destructive",
      });
      if (!ok) return;
    }

    const response = await fetch(`/api/admin/bookings/${bookingId}`, {
      body: JSON.stringify({
        action,
        cleanerId: cleanerId || null,
        cleanerIds: action === "assignTeam" ? teamIds : undefined,
        note,
        status,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setMessage(result.error ?? "Check the details and try again.");
      return;
    }

    setMessage("");
    success({
      kind: "updated",
      title:
        action === "reassign"
          ? "Cleaner reassigned"
          : action === "rematch"
            ? "Rematch started"
            : action === "assignTeam"
              ? "Team assigned"
              : action === "approve_checkin"
                ? "Arrival accepted"
                : action === "approve_checkout"
                  ? "Finish accepted"
                  : "Booking updated",
      note: "The change is in the audit trail.",
    });
    router.refresh();
  }

  async function checkInForCleaner() {
    const ok = await confirm({
      action: "Check in",
      description:
        "Only do this once you've confirmed the cleaner is at the address (for example by phone). It records their arrival without a location so they can start the clean.",
      title: "Check the cleaner in?",
    });
    if (!ok) return;
    await act("approve_checkin");
  }

  async function markNoShow() {
    const ok = await confirm({
      action: "Mark as no-show",
      description:
        "The cleaner is taken off this visit, it counts against their record, the customer is told, and we start finding a replacement.",
      title: "The cleaner isn't coming?",
      variant: "destructive",
    });
    if (!ok) return;
    const response = await fetch(`/api/bookings/${bookingId}/no-show`, {
      body: JSON.stringify({ note }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setMessage(result.error ?? "Couldn't mark this as a no-show.");
      return;
    }
    setMessage("");
    success({ kind: "updated", title: "Marked as no-show", note: "Finding a replacement now." });
    router.refresh();
  }

  function toggleTeamMember(id: string) {
    setTeamIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id].slice(0, allocatedCleaners),
    );
  }

  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-semibold">Operations controls</h2>
      <Input
        className="mt-4"
        onChange={(event) => setNote(event.target.value)}
        placeholder="Required audit note"
      />
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <SimpleSelect
          aria-label="Cleaner"
          className="h-11 min-w-0 w-full flex-1 rounded-md border-[#e8e8eb] text-[#1c133b]"
          onChange={setCleanerId}
          options={cleaners.map((cleaner) => ({ label: cleaner.full_name, value: cleaner.id }))}
          placeholder="Select cleaner"
          value={cleanerId}
        />
        <Button
          className="min-h-11 w-full sm:w-auto"
          disabled={!cleanerId || note.length < 3}
          onClick={() => void act("reassign")}
          variant="outline"
        >
          {currentStatus === "pending_match" || !currentStatus
            ? "Assign cleaner"
            : "Reassign"}
        </Button>
      </div>

      {needsTeam ? (
        <div className="mt-4 rounded-lg border border-dashed border-border p-3">
          <p className="text-sm font-semibold">
            Multi-cleaner team ({teamIds.length}/{allocatedCleaners})
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Primary stays on Reassign above. Add the remaining team here.
          </p>
          <div className="mt-3 max-h-40 space-y-2 overflow-y-auto">
            {cleaners.map((cleaner) => (
              <label
                className="flex items-center gap-2 text-sm"
                key={cleaner.id}
              >
                <RoundCheckbox
                  checked={teamIds.includes(cleaner.id)}
                  onChange={() => toggleTeamMember(cleaner.id)}
                />
                {cleaner.full_name}
              </label>
            ))}
          </div>
          <Button
            className="mt-3 min-h-11 w-full"
            disabled={
              note.length < 3 ||
              teamIds.length === 0 ||
              teamIds.length > allocatedCleaners
            }
            onClick={() => void act("assignTeam")}
            variant="outline"
          >
            Save team
          </Button>
        </div>
      ) : null}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <SimpleSelect
          aria-label="Status"
          className="h-11 min-w-0 w-full flex-1 rounded-md border-[#e8e8eb] text-[#1c133b]"
          onChange={setStatus}
          options={[
            ["pending_match", "Pending match"],
            ["matched", "Matched"],
            ["awaiting_payment", "Awaiting payment"],
            ["confirmed", "Confirmed"],
            ["cleaner_en_route", "En route"],
            ["in_progress", "In progress"],
            ["awaiting_customer_confirmation", "Awaiting confirmation"],
            ["completed", "Completed"],
            ["cancelled", "Cancelled"],
            ["disputed", "Disputed"],
          ].map(([value, label]) => ({ label, value }))}
          value={status}
        />
        <Button
          className="min-h-11 w-full sm:w-auto"
          disabled={note.length < 3}
          onClick={() => void act("status")}
          variant="outline"
        >
          Update status
        </Button>
      </div>
      {checkinOverrideRequested || checkoutOverrideRequested ? (
        <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <p>
            The cleaner&apos;s {checkinOverrideRequested ? "arrival" : "finish"}{" "}
            failed the location check. Call them if unsure, then accept it so
            the visit can carry on{checkoutOverrideRequested ? " and the customer is charged" : ""}.
          </p>
          <Button
            className="mt-2 min-h-11 w-full"
            disabled={note.length < 3}
            onClick={() =>
              void act(checkinOverrideRequested ? "approve_checkin" : "approve_checkout")
            }
          >
            {checkinOverrideRequested ? "Accept arrival" : "Accept finish"}
          </Button>
        </div>
      ) : null}
      {(currentStatus === "confirmed" || currentStatus === "cleaner_en_route") &&
      !checkinOverrideRequested ? (
        <Button
          className="mt-3 min-h-11 w-full"
          disabled={note.length < 3}
          onClick={() => void checkInForCleaner()}
          variant="outline"
        >
          Check in for the cleaner
        </Button>
      ) : null}
      {currentStatus === "confirmed" || currentStatus === "cleaner_en_route" ? (
        <Button
          className="mt-3 min-h-11 w-full"
          disabled={note.length < 3}
          onClick={() => void markNoShow()}
          variant="destructive"
        >
          Mark as no-show
        </Button>
      ) : null}
      <Button
        className="mt-3 min-h-11 w-full"
        disabled={note.length < 3}
        onClick={() => void act("rematch")}
        variant="destructive"
      >
        Find Replacement
      </Button>
      {message ? (
        <div className="mt-3">
          <ActionError message={message} title="Couldn’t update this booking" />
        </div>
      ) : null}
    </section>
  );
}
