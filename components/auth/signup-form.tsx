"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { AuthPhoneField } from "@/components/auth/auth-phone-field";
import { AuthSignupLegal } from "@/components/auth/auth-signup-legal";
import { FormField } from "@/components/auth/form-field";
import { OtpInput } from "@/components/auth/otp-input";
import { PasswordRequirementsList } from "@/components/auth/password-requirements";
import { FormStatus } from "@/components/auth/form-status";
import { OAuthButton } from "@/components/auth/oauth-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { dashboardForRole } from "@/lib/auth/redirects";
import { signupPendingLoginPath, rememberSignupEmail } from "@/lib/auth/signup-email-pending";
import {
  signupSchema,
  type SignupValues,
} from "@/lib/auth/schemas";
import {
  nationalFromPhone,
  storedPhone,
} from "@/lib/auth/uk-phone";
import { createBrowserClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/auth";

interface SignupResponse {
  devCode?: string;
  email?: string;
  error?: string;
  hasSession?: boolean;
  message?: string;
  referralPromoCode?: string | null;
  requiresEmailConfirmation?: boolean;
  requiresEmailOtp?: boolean;
  role?: UserRole;
}

export function SignupForm({
  redirectTo,
  role,
}: {
  redirectTo?: string;
  role: Extract<UserRole, "customer" | "cleaner">;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [nationalNumber, setNationalNumber] = useState("");
  const [otpEmail, setOtpEmail] = useState<string | null>(null);
  const [otpPassword, setOtpPassword] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpDevCode, setOtpDevCode] = useState<string | null>(null);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const nextPath =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : null;
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setValue,
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      phone: "",
      referral_code: "",
      marketing_opt_in: false,
      role,
    },
  });
  const passwordValue = useWatch({ control, name: "password", defaultValue: "" });
  const marketingOptIn = useWatch({
    control,
    name: "marketing_opt_in",
    defaultValue: false,
  });

  function updateNationalNumber(value: string) {
    const national = nationalFromPhone(value)
      .replace(/[^\d\s]/g, "")
      .replace(/^\s+/, "")
      .replace(/\s{2,}/g, " ");
    setNationalNumber(national);
    setValue("phone", storedPhone(national), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  useEffect(() => {
    setValue("role", role);
  }, [role, setValue]);

  useEffect(() => {
    if (role !== "customer") return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      setValue("referral_code", ref.toUpperCase(), {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [role, setValue]);

  async function finishCleanerSession(email: string, password: string) {
    const supabase = createBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      rememberSignupEmail(email);
      router.replace("/login/cleaner");
      return;
    }
    router.replace(dashboardForRole("cleaner"));
    router.refresh();
  }

  async function verifyOtp(codeOverride?: string) {
    if (!otpEmail || !otpPassword) return;
    const code = (codeOverride ?? otpCode).replace(/\D/g, "").slice(0, 6);
    if (code.length !== 6) return;
    setFormError(null);
    setOtpBusy(true);
    try {
      const response = await fetch("/api/auth/signup/verify-otp", {
        body: JSON.stringify({ code, email: otpEmail }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await parseSignupResponse(response)) as SignupResponse;
      if (!response.ok || result.error) {
        throw new Error(result.error ?? "Unable to verify that code");
      }
      await finishCleanerSession(otpEmail, otpPassword);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to verify that code",
      );
      setOtpCode("");
    } finally {
      setOtpBusy(false);
    }
  }

  async function resendOtp() {
    if (!otpEmail) return;
    setFormError(null);
    setOtpBusy(true);
    try {
      const response = await fetch("/api/auth/signup/resend-otp", {
        body: JSON.stringify({ email: otpEmail }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await parseSignupResponse(response)) as SignupResponse;
      if (!response.ok || result.error) {
        throw new Error(result.error ?? "Unable to resend the code");
      }
      setOtpMessage(result.message ?? "We sent a new code.");
      setOtpDevCode(result.devCode ?? null);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to resend the code",
      );
    } finally {
      setOtpBusy(false);
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      const response = await fetch("/api/auth/signup", {
        body: JSON.stringify({
          ...values,
          next: nextPath,
          role,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await parseSignupResponse(response)) as SignupResponse;

      if (!response.ok || result.error) {
        throw new Error(result.error ?? "Unable to create your account");
      }

      if (result.referralPromoCode) {
        window.sessionStorage.setItem(
          "mundoria-welcome-promo",
          result.referralPromoCode,
        );
      }

      if (result.requiresEmailOtp) {
        const email = (result.email ?? values.email).trim().toLowerCase();
        setOtpEmail(email);
        setOtpPassword(values.password);
        setOtpMessage(result.message ?? "We sent a 6-digit code to your email.");
        setOtpDevCode(result.devCode ?? null);
        setOtpCode("");
        return;
      }

      if (result.requiresEmailConfirmation) {
        rememberSignupEmail(values.email.trim());
        router.replace(
          signupPendingLoginPath(role, {
            next: nextPath,
          }),
        );
        return;
      }

      // Soft confirm (customers): sign in immediately; confirm mail is out-of-band.
      const supabase = createBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
      if (signInError) {
        rememberSignupEmail(values.email.trim());
        const params = new URLSearchParams();
        if (nextPath) params.set("redirectTo", nextPath);
        const base = role === "cleaner" ? "/login/cleaner" : "/login";
        const query = params.toString();
        router.replace(query ? `${base}?${query}` : base);
        return;
      }

      const accountRole = result.role ?? role;
      const destination =
        accountRole === "customer" && nextPath
          ? nextPath
          : dashboardForRole(accountRole);
      router.replace(destination);
      router.refresh();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to create your account",
      );
    }
  }, () => {
    setFormError("Please check the highlighted fields and try again.");
  });

  if (otpEmail) {
    return (
      <div className="space-y-6">
        <FormStatus message={formError} title="Couldn’t verify your email" />
        <div className="rounded-2xl border border-[#e8def8] bg-[#f7f3ff] px-4 py-4 text-sm text-[#1c133b]">
          <p className="text-base font-semibold tracking-tight">
            Enter the code we emailed you
          </p>
          <p className="mt-2 break-all font-medium text-[#312c79]">{otpEmail}</p>
          <p className="mt-2 leading-6 text-[#5a5470]">
            {otpMessage ??
              "Open your inbox and type the 6-digit code below. It expires in 15 minutes."}
          </p>
          {otpDevCode ? (
            <p className="mt-3 rounded-xl bg-white/80 px-3 py-2 font-mono text-xs text-[#9a3412]">
              Dev code: <span className="font-semibold">{otpDevCode}</span>
            </p>
          ) : null}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-[#1c133b]">Verification code</p>
          <OtpInput
            disabled={otpBusy}
            onChange={setOtpCode}
            onComplete={(code) => void verifyOtp(code)}
            value={otpCode}
          />
        </div>

        <Button
          className="w-full"
          disabled={otpBusy || otpCode.length !== 6}
          onClick={() => void verifyOtp()}
          type="button"
        >
          {otpBusy ? "Verifying…" : "Verify and create account"}
        </Button>

        <div className="flex flex-col items-center gap-3 text-sm">
          <button
            className="font-semibold text-[#291845] underline-offset-2 hover:underline disabled:opacity-50"
            disabled={otpBusy}
            onClick={() => void resendOtp()}
            type="button"
          >
            Resend code
          </button>
          <button
            className="text-muted-foreground underline-offset-2 hover:underline"
            disabled={otpBusy}
            onClick={() => {
              setOtpEmail(null);
              setOtpPassword(null);
              setOtpCode("");
              setOtpDevCode(null);
              setOtpMessage(null);
              setFormError(null);
            }}
            type="button"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <OAuthButton
        label="Continue with Google"
        next={
          role === "customer" && nextPath
            ? nextPath
            : dashboardForRole(role)
        }
        role={role}
      />
      <Divider />
      <form className="space-y-5" onSubmit={onSubmit}>
        <FormStatus message={formError} title="Couldn’t create your account" />

        <FormField error={errors.full_name} htmlFor="full_name" label="Full name">
          <Input
            autoComplete="name"
            id="full_name"
            placeholder=" "
            {...register("full_name")}
          />
        </FormField>

        <FormField error={errors.email} htmlFor="email" label="Email">
          <Input
            autoComplete="email"
            id="email"
            placeholder=" "
            type="email"
            {...register("email")}
          />
        </FormField>

        <AuthPhoneField
          error={errors.phone}
          nationalNumber={nationalNumber}
          onNationalNumberChange={updateNationalNumber}
          required
        />
        <input type="hidden" {...register("phone")} />

        <div className="space-y-2">
          <FormField error={errors.password} htmlFor="password" label="Password">
            <PasswordInput
              autoComplete="new-password"
              id="password"
              placeholder=" "
              {...register("password")}
            />
          </FormField>
          <PasswordRequirementsList password={passwordValue ?? ""} />
        </div>

        {role === "customer" ? (
          <FormField
            error={errors.referral_code}
            htmlFor="referral_code"
            label="Referral code (optional)"
          >
            <Input
              autoComplete="off"
              id="referral_code"
              placeholder=" "
              {...register("referral_code")}
            />
          </FormField>
        ) : null}

        <AuthSignupLegal
          checked={Boolean(marketingOptIn)}
          onCheckedChange={(checked) =>
            setValue("marketing_opt_in", checked, { shouldDirty: true })
          }
        />

        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting
            ? role === "cleaner"
              ? "Sending code…"
              : "Creating account…"
            : role === "cleaner"
              ? "Continue"
              : "Create account"}
        </Button>
      </form>
    </div>
  );
}

async function parseSignupResponse(response: Response) {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  if (!response.ok) {
    return {
      error:
        text ||
        `Signup failed with status ${response.status}. Check your Supabase setup.`,
    };
  }

  return {};
}

function Divider() {
  return (
    <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      or use email
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
