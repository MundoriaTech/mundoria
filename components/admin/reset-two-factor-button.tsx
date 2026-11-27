"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmModal } from "@/components/shared/confirm-modal";
import { useFeedback } from "@/components/shared/feedback-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Lets an admin clear another admin's authenticator after a lost phone. */
export function ResetTwoFactorButton({ adminId, name }: { adminId: string; name: string }) {
  const router = useRouter();
  const { success } = useFeedback();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" variant="outline">
        Reset two-factor
      </Button>
      {open ? (
        <ConfirmModal
          action="Reset two-factor"
          confirmDisabled={note.trim().length < 3}
          description={`${name} will have to set up their authenticator app again at their next sign-in. Only do this once you've confirmed it's really them (for example by phone). They'll get an email about it.`}
          onCancel={() => {
            setOpen(false);
            setNote("");
            setError("");
          }}
          onConfirm={async () => {
            const res = await fetch(`/api/admin/team/${adminId}/reset-two-factor`, {
              body: JSON.stringify({ note }),
              headers: { "Content-Type": "application/json" },
              method: "POST",
            });
            const json = (await res.json().catch(() => ({}))) as { error?: string };
            if (!res.ok) {
              setError(json.error ?? "Couldn't reset two-factor.");
              return;
            }
            success({ kind: "updated", note: `${name} has been emailed.`, title: "Two-factor reset" });
            setOpen(false);
            setNote("");
            router.refresh();
          }}
          title={`Reset ${name}'s two-factor?`}
          variant="destructive"
        >
          <div className="space-y-2 text-sm">
            <Input
              onChange={(event) => setNote(event.target.value)}
              placeholder="Reason, e.g. lost phone, confirmed by call (required)"
              value={note}
            />
            {error ? <p className="text-red-700">{error}</p> : null}
          </div>
        </ConfirmModal>
      ) : null}
    </>
  );
}
