"use client";

import { useState } from "react";

import { FormStatus } from "@/components/auth/form-status";
import { useFeedback } from "@/components/shared/feedback-provider";
import { cn } from "@/lib/utils";

const accountInputClass =
  "h-11 w-full rounded-[12px] border-[1.5px] border-[#E1E1EA] bg-white px-3.5 text-[15px] text-[#1E1848] outline-none placeholder:text-[#8B8798] focus:border-[#524096] disabled:bg-[#ECEBF1] disabled:text-[#6B6B70]";

export function ChangeEmailForm({
  currentEmail,
  embedded = false,
}: {
  currentEmail: string;
  /** Compact account chrome — no cream fields, no duplicate Email label. */
  embedded?: boolean;
}) {
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

  if (embedded) {
    return (
      <div className="space-y-2">
        <input
          aria-label="Email address"
          className={accountInputClass}
          disabled
          readOnly
          value={currentEmail}
        />
        {sentTo ? (
          <p className="m-0 rounded-[12px] bg-[#EAE7F5] px-3 py-2 text-[13px] leading-5 text-[#524096]">
            Confirmation sent to <span className="font-semibold">{sentTo}</span>.
            Your login stays as {currentEmail} until you open that link.
          </p>
        ) : null}
        {!open ? (
          <button
            className="text-[13px] font-semibold text-[#524096] hover:underline"
            onClick={() => {
              setOpen(true);
              setError(null);
            }}
            type="button"
          >
            Change email
          </button>
        ) : (
          <form
            className="space-y-2.5 rounded-[14px] bg-[#F3F4F6] p-3"
            onSubmit={(event) => void submit(event)}
          >
            <p className="m-0 text-[13px] leading-5 text-[#5F5F66]">
              We&apos;ll email a confirmation link to the new address. Your
              current email stays active until you confirm.
            </p>
            <input
              autoComplete="email"
              className={accountInputClass}
              onChange={(event) => setNewEmail(event.target.value)}
              placeholder="New email"
              required
              type="email"
              value={newEmail}
            />
            <input
              autoComplete="current-password"
              className={accountInputClass}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Current password"
              required
              type="password"
              value={password}
            />
            <FormStatus message={error} title="Couldn’t change email" />
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-full bg-[#524096] px-3.5 py-1.5 text-[13px] font-semibold text-white disabled:opacity-60"
                disabled={pending}
                type="submit"
              >
                {pending ? "Sending…" : "Send confirmation"}
              </button>
              <button
                className="rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-[#5F5F66] hover:bg-white"
                disabled={pending}
                onClick={() => {
                  setOpen(false);
                  setError(null);
                  setPassword("");
                }}
                type="button"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block space-y-2 text-sm font-medium">
        <span>Email</span>
        <input
          className={cn(
            "flex h-11 w-full rounded-md border border-[#e8e8eb] bg-[#f9f6ef] px-3 py-2 text-sm text-[#1c133b] outline-none disabled:cursor-not-allowed disabled:opacity-50",
          )}
          disabled
          value={currentEmail}
        />
      </label>
      {sentTo ? (
        <p className="rounded-xl bg-[#efe6ff] px-3 py-2 text-sm leading-6 text-[#3b3358]">
          Confirmation sent to <span className="font-semibold">{sentTo}</span>.
          Your login stays as {currentEmail} until you open that link.
        </p>
      ) : null}
      {!open ? (
        <button
          className="inline-flex h-10 items-center justify-center rounded-full border border-[#e6e0f2] px-4 text-sm font-semibold text-[#1c133b]"
          onClick={() => {
            setOpen(true);
            setError(null);
          }}
          type="button"
        >
          Change email
        </button>
      ) : (
        <form
          className="space-y-4 rounded-2xl border border-[#e4daf5] bg-[#faf8fc] p-4"
          onSubmit={(event) => void submit(event)}
        >
          <p className="text-sm leading-6 text-[#5a5470]">
            We will email a confirmation link to the new address and notify{" "}
            {currentEmail}. Your current email stays active until you confirm.
          </p>
          <label className="block space-y-1.5 text-sm font-medium">
            <span>New email</span>
            <input
              autoComplete="email"
              className="flex h-11 w-full rounded-md border border-[#e8e8eb] bg-white px-3 py-2 text-sm text-[#1c133b] outline-none focus:ring-2 focus:ring-[#6a45b8]/30"
              onChange={(event) => setNewEmail(event.target.value)}
              required
              type="email"
              value={newEmail}
            />
          </label>
          <label className="block space-y-1.5 text-sm font-medium">
            <span>Current password</span>
            <input
              autoComplete="current-password"
              className="flex h-11 w-full rounded-md border border-[#e8e8eb] bg-white px-3 py-2 text-sm text-[#1c133b] outline-none focus:ring-2 focus:ring-[#6a45b8]/30"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <FormStatus message={error} title="Couldn’t change email" />
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#1c133b] px-4 text-sm font-semibold text-white disabled:opacity-60"
              disabled={pending}
              type="submit"
            >
              {pending ? "Sending…" : "Send confirmation"}
            </button>
            <button
              className="inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold text-[#5a5470]"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                setError(null);
                setPassword("");
              }}
              type="button"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
