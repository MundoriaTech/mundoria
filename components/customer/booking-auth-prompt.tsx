"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { OAuthButton } from "@/components/auth/oauth-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrowserClient } from "@/lib/supabase/client";

export type BookingAuthMode = "ask" | "create" | "signin";

const RETURN_PATH = "/booking/new";

export function BookingAuthPrompt({
  mode,
  onModeChange,
}: {
  mode: BookingAuthMode;
  onModeChange: (mode: BookingAuthMode) => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function setMode(next: BookingAuthMode) {
    setMessage(null);
    onModeChange(next);
  }

  function continueWithEmail(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setMessage("Enter a valid email address.");
      return;
    }
    setEmail(trimmed);
    setMode("create");
  }

  async function createAccount(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/signup", {
        body: JSON.stringify({
          email: email.trim(),
          full_name: fullName.trim(),
          password,
          phone: "",
          referral_code: "",
          role: "customer",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as {
        code?: string;
        error?: string;
        requiresEmailConfirmation?: boolean;
      };

      if (result.code === "email_taken") {
        setMode("signin");
        setMessage("That email already has an account — enter your password to continue.");
        setBusy(false);
        return;
      }

      if (!response.ok || result.error) {
        throw new Error(result.error ?? "Unable to create your account.");
      }
      if (result.requiresEmailConfirmation) {
        setMessage(
          "Check your inbox to confirm your email, then return here to finish.",
        );
        setBusy(false);
        return;
      }
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to create your account.",
      );
      setBusy(false);
    }
  }

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw new Error(error.message);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        {mode === "ask"
          ? "Where should we send your booking?"
          : mode === "create"
            ? "Create your account"
            : "Sign in"}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {mode === "ask"
          ? "Your selections are already saved. Add an email to continue to your address."
          : mode === "create"
            ? "Name and a password — then you’ll go straight back to booking."
            : "Enter your password to continue this booking."}
      </p>

      {mode === "ask" ? (
        <div className="mt-6 space-y-4">
          <form className="space-y-3" onSubmit={continueWithEmail}>
            <Input
              autoComplete="email"
              className="h-11"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              type="email"
              value={email}
            />
            <Button className="h-11 w-full" type="submit">
              Continue
            </Button>
          </form>

          <OAuthButton
            label="Use Google"
            next={RETURN_PATH}
            role="customer"
          />

          <button
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setMode("signin")}
            type="button"
          >
            I already have an account
          </button>
        </div>
      ) : null}

      {mode === "create" ? (
        <form
          className="mt-6 space-y-3"
          onSubmit={(event) => void createAccount(event)}
        >
          <EmailChip email={email} onEdit={() => setMode("ask")} />
          <Input
            autoComplete="name"
            className="h-11"
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Full name"
            value={fullName}
          />
          <Input
            autoComplete="new-password"
            className="h-11"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            type="password"
            value={password}
          />
          <Button className="h-11 w-full" disabled={busy} type="submit">
            {busy ? "Saving…" : "Continue booking"}
          </Button>
          <button
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setMode("signin")}
            type="button"
          >
            Sign in instead
          </button>
        </form>
      ) : null}

      {mode === "signin" ? (
        <form
          className="mt-6 space-y-3"
          onSubmit={(event) => void signIn(event)}
        >
          {email ? (
            <EmailChip email={email} onEdit={() => setMode("ask")} />
          ) : (
            <Input
              autoComplete="email"
              className="h-11"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              type="email"
              value={email}
            />
          )}
          <Input
            autoComplete="current-password"
            className="h-11"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            type="password"
            value={password}
          />
          <Button className="h-11 w-full" disabled={busy} type="submit">
            {busy ? "Signing in…" : "Continue booking"}
          </Button>
          <div className="flex justify-between gap-3 text-sm text-muted-foreground">
            <Link
              className="hover:text-foreground"
              href={`/forgot-password?redirectTo=${encodeURIComponent(RETURN_PATH)}`}
            >
              Forgot password?
            </Link>
            <button
              className="hover:text-foreground"
              onClick={() => setMode(email ? "create" : "ask")}
              type="button"
            >
              New account
            </button>
          </div>
        </form>
      ) : null}

      {message ? (
        <p
          className={
            message.toLowerCase().includes("check your inbox")
              ? "mt-4 text-sm text-muted-foreground"
              : "mt-4 text-sm text-destructive"
          }
          role="alert"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

function EmailChip({
  email,
  onEdit,
}: {
  email: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-3 text-sm">
      <span className="min-w-0 truncate text-foreground">{email}</span>
      <button
        className="shrink-0 text-muted-foreground hover:text-foreground"
        onClick={onEdit}
        type="button"
      >
        Edit
      </button>
    </div>
  );
}
