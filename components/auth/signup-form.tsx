"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { AuthPhoneField } from "@/components/auth/auth-phone-field";
import { AuthSignupLegal } from "@/components/auth/auth-signup-legal";
import { FormField } from "@/components/auth/form-field";
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
  error?: string;
  hasSession?: boolean;
  referralPromoCode?: string | null;
  requiresEmailConfirmation?: boolean;
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
            ? "Creating account…"
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
