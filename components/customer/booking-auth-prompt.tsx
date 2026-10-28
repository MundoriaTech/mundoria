"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthPhoneField } from "@/components/auth/auth-phone-field";
import { AuthSignupLegal } from "@/components/auth/auth-signup-legal";
import { FormField } from "@/components/auth/form-field";
import { FormStatus } from "@/components/auth/form-status";
import { PasswordRequirementsList } from "@/components/auth/password-requirements";
import { OAuthButton } from "@/components/auth/oauth-button";
import { passwordMeetsRequirements } from "@/lib/auth/password-requirements";
import {
  clearSignupEmail,
  readSignupEmail,
  rememberSignupEmail,
  SIGNUP_VERIFY_MESSAGE,
} from "@/lib/auth/signup-email-pending";
import {
  BOOKING_CHECKOUT_RETURN_PATH,
  markBookingAuthReturn,
  rememberBookingCheckoutStep,
} from "@/lib/customer/booking-auth-return";
import { ActionError } from "@/components/shared/action-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  nationalFromPhone,
  storedPhone,
} from "@/lib/auth/uk-phone";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { isUserRole } from "@/types/auth";

export type BookingAuthMode = "ask" | "create" | "signin";

const RETURN_PATH = BOOKING_CHECKOUT_RETURN_PATH;

export function BookingAuthPrompt({
  hideTitle = false,
  initialVerifyPending = false,
  mode,
  onModeChange,
}: {
  hideTitle?: boolean;
  /** Landing from email-confirmation signup — open sign-in with success copy. */
  initialVerifyPending?: boolean;
  mode: BookingAuthMode;
  onModeChange: (mode: BookingAuthMode) => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [nationalNumber, setNationalNumber] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    initialVerifyPending ? SIGNUP_VERIFY_MESSAGE : null,
  );
  const [busy, setBusy] = useState(false);
  const passwordReady = passwordMeetsRequirements(password);

  useEffect(() => {
    if (!initialVerifyPending) return;
    const stored = readSignupEmail();
    if (stored) {
      setEmail(stored);
      clearSignupEmail();
    }
  }, [initialVerifyPending]);

  function setMode(next: BookingAuthMode) {
    setMessage(null);
    setSuccessMessage(null);
    setPasswordError(undefined);
    onModeChange(next);
  }

  async function continueWithEmail(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setMessage("Enter a valid email address.");
      return;
    }
    setEmail(trimmed);
    setBusy(true);
    try {
      const response = await fetch("/api/auth/email-status", {
        body: JSON.stringify({ email: trimmed }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as {
        error?: string;
        exists?: boolean;
        role?: string | null;
      };
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to check that email.");
      }
      if (result.exists) {
        if (result.role && result.role !== "customer") {
          setMessage(
            result.role === "cleaner"
              ? "Cleaner accounts can’t book. Use a customer email instead."
              : "This account can’t continue a booking. Use a customer email.",
          );
          return;
        }
        setMode("signin");
        return;
      }
      setMode("create");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to check that email.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function createAccount(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setPasswordError(undefined);
    const phone = storedPhone(nationalFromPhone(nationalNumber));
    if (phone.replace(/\D/g, "").length < 10) {
      setMessage("Enter a valid phone number.");
      setBusy(false);
      return;
    }
    if (!passwordMeetsRequirements(password)) {
      setPasswordError(
        "Use 8+ characters with uppercase, lowercase, a number, and a symbol.",
      );
      setBusy(false);
      return;
    }
    try {
      const response = await fetch("/api/auth/signup", {
        body: JSON.stringify({
          email: email.trim(),
          full_name: fullName.trim(),
          marketing_opt_in: marketingOptIn,
          next: RETURN_PATH,
          password,
          phone,
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
        setBusy(false);
        return;
      }

      if (!response.ok || result.error) {
        throw new Error(result.error ?? "Unable to create your account.");
      }

      // Booking signup auto-confirms — sign in immediately and stay on checkout.
      if (!result.requiresEmailConfirmation) {
        const supabase = createBrowserClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (signInError) {
          rememberSignupEmail(email.trim());
          setPassword("");
          setSuccessMessage(
            "Account created. Enter your password to continue this booking.",
          );
          onModeChange("signin");
          return;
        }
        markBookingAuthReturn();
        // Refresh session in place — avoid replace/remount that rebuilds the
        // wizard history stack and can drop the customer back mid-funnel.
        rememberBookingCheckoutStep();
        router.refresh();
        return;
      }

      rememberSignupEmail(email.trim());
      setPassword("");
      setPasswordError(undefined);
      setMessage(null);
      setSuccessMessage(SIGNUP_VERIFY_MESSAGE);
      onModeChange("signin");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to create your account.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw new Error(error.message);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile && isUserRole(profile.role) && profile.role !== "customer") {
        await supabase.auth.signOut();
        setMessage(
          profile.role === "cleaner"
            ? "Cleaner accounts can’t book. Create or sign in with a customer account instead."
            : "This account can’t continue a booking. Use a customer account.",
        );
        setBusy(false);
        return;
      }

      markBookingAuthReturn();
      rememberBookingCheckoutStep();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      {!hideTitle ? (
        <>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {mode === "ask"
              ? "Where should we send your booking?"
              : mode === "create"
                ? "Create your account"
                : "Sign in"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {mode === "ask"
              ? "Your selections are already saved. Enter your email to create an account or sign in."
              : mode === "create"
                ? "Save your details to finish this booking. You can manage cleans from your account anytime."
                : "Enter your password to continue this booking."}
          </p>
        </>
      ) : null}

      {mode === "ask" ? (
        <div className={cn("space-y-4", !hideTitle && "mt-6")}>
          <form className="space-y-3" onSubmit={(event) => void continueWithEmail(event)}>
            <FormField htmlFor="booking-auth-email" label="Email">
              <Input
                autoComplete="email"
                id="booking-auth-email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder=" "
                type="email"
                value={email}
              />
            </FormField>
            <Button
              className="h-11 w-full"
              loading={busy}
              loadingLabel="Checking…"
              type="submit"
            >
              Continue
            </Button>
          </form>

          <OAuthButton
            label="Use Google"
            next={RETURN_PATH}
            onBeforeRedirect={markBookingAuthReturn}
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
          className={cn("space-y-3", !hideTitle && "mt-6")}
          onSubmit={(event) => void createAccount(event)}
        >
          <EmailChip email={email} onEdit={() => setMode("ask")} />
          <FormField htmlFor="booking-auth-full-name" label="Full name">
            <Input
              autoComplete="name"
              id="booking-auth-full-name"
              onChange={(event) => setFullName(event.target.value)}
              placeholder=" "
              required
              value={fullName}
            />
          </FormField>
          <AuthPhoneField
            htmlFor="booking-auth-phone"
            nationalNumber={nationalNumber}
            onNationalNumberChange={(value) =>
              setNationalNumber(nationalFromPhone(value))
            }
            required
          />
          <div className="space-y-2">
            <FormField
              error={
                passwordError ? { message: passwordError, type: "validate" } : undefined
              }
              htmlFor="booking-auth-password"
              label="Password"
            >
              <PasswordInput
                autoComplete="new-password"
                id="booking-auth-password"
                onChange={(event) => {
                  setPassword(event.target.value);
                  setPasswordError(undefined);
                }}
                placeholder=" "
                required
                value={password}
              />
            </FormField>
            <PasswordRequirementsList password={password} />
          </div>
          <AuthSignupLegal
            checked={marketingOptIn}
            id="booking-marketing-opt-in"
            onCheckedChange={setMarketingOptIn}
          />
          <Button
            className="h-11 w-full"
            disabled={!passwordReady}
            loading={busy}
            loadingLabel="Saving…"
            type="submit"
          >
            Create account
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
          className={cn("space-y-3", !hideTitle && "mt-6")}
          onSubmit={(event) => void signIn(event)}
        >
          <FormStatus message={successMessage} tone="success" />
          {email ? (
            <EmailChip email={email} onEdit={() => setMode("ask")} />
          ) : (
            <FormField htmlFor="booking-auth-signin-email" label="Email">
              <Input
                autoComplete="email"
                id="booking-auth-signin-email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder=" "
                type="email"
                value={email}
              />
            </FormField>
          )}
          <FormField htmlFor="booking-auth-signin-password" label="Password">
            <PasswordInput
              autoComplete="current-password"
              id="booking-auth-signin-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder=" "
              required
              value={password}
            />
          </FormField>
          <Button
            className="h-11 w-full"
            loading={busy}
            loadingLabel="Signing in…"
            type="submit"
          >
            Continue booking
          </Button>
          <div className="flex justify-between gap-3 text-sm text-muted-foreground">
            <Link
              className="hover:text-foreground"
              href={`/forgot-password?redirectTo=${encodeURIComponent(RETURN_PATH)}`}
              onClick={markBookingAuthReturn}
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
        <div className="mt-4">
          <ActionError
            message={message}
            title={
              mode === "signin"
                ? "Couldn’t sign you in"
                : "Couldn’t continue"
            }
          />
        </div>
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
