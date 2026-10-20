"use client";

import { useState } from "react";

import { FormStatus } from "@/components/auth/form-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFeedback } from "@/components/shared/feedback-provider";
import { normalizePhone } from "@/lib/auth/phone-verify";

export function PhoneVerifyPanel({
  phone,
  phoneVerifiedAt,
  onVerified,
}: {
  onVerified: (verifiedAt: string) => void;
  phone: string;
  phoneVerifiedAt: string | null | undefined;
}) {
  const { success } = useFeedback();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [awaitingCode, setAwaitingCode] = useState(false);

  const verified =
    Boolean(phoneVerifiedAt) &&
    normalizePhone(phone).length >= 7;

  async function sendCode() {
    setSending(true);
    setError(null);
    setDevCode(null);
    const response = await fetch("/api/auth/phone/send-code", {
      body: JSON.stringify({ phone }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as {
      devCode?: string;
      error?: string;
      message?: string;
    };
    setSending(false);
    if (!response.ok && !result.devCode) {
      setError(result.error ?? "Unable to send a code.");
      return;
    }
    if (result.devCode) {
      setDevCode(result.devCode);
    }
    setAwaitingCode(true);
    success({
      kind: "sent",
      title: "Code sent",
      note: result.message ?? "Enter the 6-digit SMS code below.",
    });
  }

  async function verify() {
    setVerifying(true);
    setError(null);
    const response = await fetch("/api/auth/phone/verify-code", {
      body: JSON.stringify({ code, phone }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as {
      error?: string;
      phoneVerifiedAt?: string;
    };
    setVerifying(false);
    if (!response.ok || !result.phoneVerifiedAt) {
      setError(result.error ?? "Unable to verify that code.");
      return;
    }
    setCode("");
    setAwaitingCode(false);
    setDevCode(null);
    onVerified(result.phoneVerifiedAt);
    success({
      kind: "done",
      title: "Phone verified",
      note: "This number is trusted for job contact.",
    });
  }

  if (verified) {
    return (
      <p className="rounded-xl bg-[#efe6ff] px-3 py-2 text-sm text-[#312c79]">
        Phone verified for job contact.
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-[#f0c4b8] bg-[#fff7f2] p-4">
      <div>
        <p className="text-sm font-semibold text-[#1c133b]">
          Verify your phone
        </p>
        <p className="mt-1 text-sm leading-6 text-[#5a5470]">
          Cleaners need a verified number before Mundoria treats it as trusted
          for jobs. Changing your number resets verification.
        </p>
      </div>
      <FormStatus message={error} title="Phone verification" />
      {devCode ? (
        <p className="rounded-lg bg-white px-3 py-2 text-xs text-[#5a5470]">
          Development code: <span className="font-mono font-semibold">{devCode}</span>
        </p>
      ) : null}
      {!awaitingCode ? (
        <Button
          className="rounded-full"
          disabled={sending || normalizePhone(phone).length < 7}
          onClick={() => void sendCode()}
          type="button"
        >
          {sending ? "Sending…" : "Send SMS code"}
        </Button>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="block min-w-0 flex-1 space-y-1 text-sm font-medium">
            <span>6-digit code</span>
            <Input
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              value={code}
            />
          </label>
          <Button
            className="rounded-full"
            disabled={verifying || code.length !== 6}
            onClick={() => void verify()}
            type="button"
          >
            {verifying ? "Checking…" : "Verify"}
          </Button>
          <Button
            className="rounded-full"
            disabled={sending}
            onClick={() => void sendCode()}
            type="button"
            variant="outline"
          >
            Resend
          </Button>
        </div>
      )}
    </div>
  );
}
