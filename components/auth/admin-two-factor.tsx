"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrowserClient } from "@/lib/supabase/client";

type Step =
  | { kind: "loading" }
  | { kind: "enroll"; factorId: string; qrCode: string; secret: string }
  | { kind: "verify"; factorId: string }
  | { kind: "error"; message: string };

const NOT_ENABLED =
  "Authenticator sign-in isn't switched on for Mundoria yet. In Supabase, open Authentication → Multi-Factor and enable Authenticator app (TOTP), then reload this page.";

/**
 * Admins set up an authenticator app the first time, then enter a code from
 * it at every sign-in. Supabase marks the session aal2 once a code is
 * verified; the admin portal only opens for aal2 sessions.
 */
export function AdminTwoFactor({ redirectTo }: { redirectTo: string }) {
  const [step, setStep] = useState<Step>({ kind: "loading" });
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function start() {
      const supabase = createBrowserClient();
      const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assurance?.currentLevel === "aal2") {
        window.location.assign(redirectTo);
        return;
      }
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) {
        if (!cancelled) setStep({ kind: "error", message: listError.message });
        return;
      }
      const verified = factors?.totp?.[0];
      if (verified) {
        if (!cancelled) setStep({ kind: "verify", factorId: verified.id });
        return;
      }
      // Clear half-finished setups so a fresh QR code can be made.
      for (const factor of factors?.all ?? []) {
        if (factor.factor_type === "totp" && factor.status !== "verified") {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        }
      }
      const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Mundoria admin ${new Date().toISOString().slice(0, 16)}`,
        issuer: "Mundoria",
      });
      if (cancelled) return;
      if (enrollError || !enrolled) {
        const message = enrollError?.message ?? "";
        setStep({
          kind: "error",
          message: /disabled|not enabled|mfa_totp_enroll_not_enabled/i.test(message)
            ? NOT_ENABLED
            : message || "Couldn't start the authenticator setup.",
        });
        return;
      }
      setStep({
        factorId: enrolled.id,
        kind: "enroll",
        qrCode: enrolled.totp.qr_code,
        secret: enrolled.totp.secret,
      });
    }
    void start();
    return () => {
      cancelled = true;
    };
  }, [redirectTo]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (step.kind !== "enroll" && step.kind !== "verify") return;
    setBusy(true);
    setError("");
    const { error: verifyError } = await createBrowserClient().auth.mfa.challengeAndVerify({
      code: code.replace(/\s+/g, ""),
      factorId: step.factorId,
    });
    setBusy(false);
    if (verifyError) {
      setError(
        /invalid|expired/i.test(verifyError.message)
          ? "That code didn't work. Check the time on your phone is correct and try the newest code."
          : verifyError.message,
      );
      setCode("");
      return;
    }
    // A full load so the server sees the upgraded session.
    window.location.assign(redirectTo);
  }

  async function signOut() {
    await createBrowserClient().auth.signOut();
    window.location.assign("/admin/login");
  }

  if (step.kind === "loading") {
    return <p className="text-sm text-[#5a5470]">Loading…</p>;
  }
  if (step.kind === "error") {
    return (
      <div className="space-y-4">
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{step.message}</p>
        <Button className="w-full" onClick={() => void signOut()} variant="outline">
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      {step.kind === "enroll" ? (
        <div className="space-y-3 text-sm text-[#1c133b]">
          <p className="font-semibold">Set up your authenticator app</p>
          <ol className="list-decimal space-y-1 pl-5 text-[#5a5470]">
            <li>
              Open an authenticator app on your phone, such as Google Authenticator, Microsoft Authenticator or
              1Password.
            </li>
            <li>Add an account and scan this code.</li>
            <li>Enter the 6-digit code the app shows.</li>
          </ol>
          {/* Supabase returns the QR code as an SVG data URL. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="QR code for your authenticator app"
            className="mx-auto h-48 w-48 rounded-lg border border-[#e8e0f4] bg-white p-2"
            src={step.qrCode}
          />
          <details className="text-xs text-[#5a5470]">
            <summary className="cursor-pointer">Can&apos;t scan it? Enter this key instead</summary>
            <code className="mt-2 block break-all rounded bg-[#f5f2fb] p-2 font-mono text-[#1c133b]">
              {step.secret}
            </code>
          </details>
        </div>
      ) : (
        <p className="text-sm text-[#5a5470]">Enter the 6-digit code from your authenticator app.</p>
      )}

      <Input
        aria-label="6-digit code"
        autoComplete="one-time-code"
        autoFocus
        inputMode="numeric"
        maxLength={7}
        onChange={(event) => setCode(event.target.value)}
        pattern="[0-9 ]*"
        placeholder="123456"
        value={code}
      />
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button className="w-full" disabled={busy || code.replace(/\s+/g, "").length !== 6} type="submit">
        {busy ? "Checking…" : step.kind === "enroll" ? "Finish setup" : "Continue"}
      </Button>
      <p className="text-center text-xs text-[#5a5470]">
        Lost your phone? Ask another admin to reset your two-factor on the Team page.{" "}
        <button className="font-medium text-[#6a45b8] hover:underline" onClick={() => void signOut()} type="button">
          Sign out
        </button>
      </p>
    </form>
  );
}
