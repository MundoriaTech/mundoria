"use client";

import { useState } from "react";

import { FormField } from "@/components/auth/form-field";
import { FormStatus } from "@/components/auth/form-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useFeedback } from "@/components/shared/feedback-provider";

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const { success } = useFeedback();
  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const response = await fetch("/api/auth/change-email", {
      body: JSON.stringify({ newEmail, password }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as {
      error?: string;
      message?: string;
    };
    setPending(false);
    if (!response.ok) {
      setError(result.error ?? "Unable to change email.");
      return;
    }
    setSentTo(newEmail.trim());
    setPassword("");
    setNewEmail("");
    setOpen(false);
    success({
      kind: "sent",
      title: "Confirm your new email",
      note:
        result.message ??
        "We sent a confirmation link to the new address. Your current email stays active until you confirm.",
    });
  }

  return (
    <div className="space-y-3">
      <label className="block space-y-2 text-sm font-medium">
        <span>Email</span>
        <Input disabled value={currentEmail} />
      </label>
      {sentTo ? (
        <p className="rounded-xl bg-[#efe6ff] px-3 py-2 text-sm leading-6 text-[#3b3358]">
          Confirmation sent to <span className="font-semibold">{sentTo}</span>.
          Your login stays as {currentEmail} until you open that link.
        </p>
      ) : null}
      {!open ? (
        <Button
          className="rounded-full"
          onClick={() => {
            setOpen(true);
            setError(null);
          }}
          type="button"
          variant="outline"
        >
          Change email
        </Button>
      ) : (
        <form
          className="space-y-4 rounded-2xl border border-[#e4daf5] bg-[#faf8fc] p-4"
          onSubmit={(event) => void submit(event)}
        >
          <p className="text-sm leading-6 text-[#5a5470]">
            We will email a confirmation link to the new address and notify{" "}
            {currentEmail}. Your current email stays active until you confirm.
          </p>
          <FormField htmlFor="change-email-new" label="New email">
            <Input
              autoComplete="email"
              id="change-email-new"
              onChange={(event) => setNewEmail(event.target.value)}
              required
              type="email"
              value={newEmail}
            />
          </FormField>
          <FormField htmlFor="change-email-password" label="Current password">
            <PasswordInput
              autoComplete="current-password"
              id="change-email-password"
              onChange={(event) => setPassword(event.target.value)}
              required
              value={password}
            />
          </FormField>
          <FormStatus message={error} title="Couldn’t change email" />
          <div className="flex flex-wrap gap-2">
            <Button className="rounded-full" disabled={pending} type="submit">
              {pending ? "Sending…" : "Send confirmation"}
            </Button>
            <Button
              className="rounded-full"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                setError(null);
                setPassword("");
              }}
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
