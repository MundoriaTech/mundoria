"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ActionError } from "@/components/shared/action-error";
import { useFeedback } from "@/components/shared/feedback-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RemoveUserButton({
  allowed,
  blockMessage,
  fullName,
  role,
  userId,
}: {
  allowed: boolean;
  blockMessage: string | null;
  fullName: string;
  role: "customer" | "cleaner";
  userId: string;
}) {
  const router = useRouter();
  const { confirm, success } = useFeedback();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!allowed) {
    return (
      <section className="rounded-xl border border-[#efe8f8] bg-[#fbf9ff] p-4 sm:p-5">
        <h2 className="font-semibold text-[#1c133b]">Remove account</h2>
        <p className="mt-2 text-sm leading-6 text-[#5a5470]">
          {blockMessage ??
            "This account cannot be permanently deleted from the portal."}
          {role === "cleaner"
            ? " Use ban or suspend in the review panel when you need to stop a cleaner working."
            : ""}
        </p>
      </section>
    );
  }

  async function onRemove() {
    const note = reason.trim();
    if (note.length < 3) {
      setMessage("Add a short note first (at least 3 characters).");
      return;
    }

    const ok = await confirm({
      action: "Delete account",
      description: `Permanently removes ${fullName}. Only unused accounts with no bookings or payouts can be deleted. This cannot be undone.`,
      title: "Delete this account?",
      variant: "destructive",
    });
    if (!ok) return;

    setBusy(true);
    setMessage(null);
    const response = await fetch(`/api/admin/users/${userId}`, {
      body: JSON.stringify({ reason: note }),
      headers: { "Content-Type": "application/json" },
      method: "DELETE",
    });
    const result = (await response.json()) as {
      error?: string;
      redirectTo?: string;
    };
    setBusy(false);

    if (!response.ok) {
      setMessage(result.error ?? "Unable to delete this account.");
      return;
    }

    success({
      kind: "done",
      note: "The account was removed and the action was logged.",
      title: "Account deleted",
    });
    router.push(result.redirectTo ?? "/admin/customers");
    router.refresh();
  }

  return (
    <section className="rounded-xl border border-red-200/80 bg-[#fff7f5] p-4 sm:p-5">
      <h2 className="font-semibold text-[#1c133b]">Remove unused account</h2>
      <p className="mt-2 text-sm leading-6 text-[#5a5470]">
        This {role} has no bookings or payout history, so you can permanently
        delete the account (spam or abandoned signups).
      </p>
      <label className="mt-4 block text-sm font-medium text-[#1c133b]">
        Reason
        <Input
          className="mt-1.5 bg-white"
          disabled={busy}
          onChange={(event) => setReason(event.target.value)}
          placeholder="e.g. Spam signup, gibberish name"
          value={reason}
        />
      </label>
      <div className="mt-4">
        <Button
          disabled={busy}
          onClick={() => void onRemove()}
          type="button"
          variant="destructive"
        >
          {busy ? "Deleting…" : "Delete account"}
        </Button>
      </div>
      {message ? (
        <div className="mt-3">
          <ActionError message={message} title="Couldn’t delete account" />
        </div>
      ) : null}
    </section>
  );
}
