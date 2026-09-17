"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { FormField } from "@/components/auth/form-field";
import { FormStatus } from "@/components/auth/form-status";
import { OAuthButton } from "@/components/auth/oauth-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { dashboardForRole } from "@/lib/auth/redirects";
import {
  signupSchema,
  type SignupValues,
} from "@/lib/auth/schemas";
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
  const [success, setSuccess] = useState<string | null>(null);
  const nextPath =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : null;
  const {
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
      role,
    },
  });

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
    setSuccess(null);

    try {
      const response = await fetch("/api/auth/signup", {
        body: JSON.stringify({ ...values, role }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await parseSignupResponse(response)) as SignupResponse;

      if (!response.ok || result.error) {
        throw new Error(result.error ?? "Unable to create your account");
      }

      if (result.requiresEmailConfirmation) {
        setSuccess(
          result.referralPromoCode
            ? `Account created. Check your inbox to confirm your email. Your welcome code is ${result.referralPromoCode}.`
            : "Account created. Check your inbox to confirm your email, then sign in.",
        );
        return;
      }

      const accountRole = result.role ?? role;
      if (result.referralPromoCode) {
        window.sessionStorage.setItem(
          "mundoria-welcome-promo",
          result.referralPromoCode,
        );
      }
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
    setSuccess(null);
    setFormError("Please check the highlighted fields and try again.");
  });

  return (
    <div className="space-y-6">
      <OAuthButton
        label={
          role === "cleaner"
            ? "Continue with Google as a cleaner"
            : "Continue with Google as a customer"
        }
        next={
          role === "customer" && nextPath
            ? nextPath
            : dashboardForRole(role)
        }
        role={role}
      />
      <Divider />
      <form className="space-y-5" onSubmit={onSubmit}>
        <FormStatus message={formError} />
        <FormStatus message={success} tone="success" />

        <FormField error={errors.full_name} htmlFor="full_name" label="Full name">
          <Input
            autoComplete="name"
            id="full_name"
            placeholder="Alex Morgan"
            {...register("full_name")}
          />
        </FormField>

        <FormField error={errors.email} htmlFor="email" label="Email">
          <Input
            autoComplete="email"
            id="email"
            placeholder="alex@example.com"
            type="email"
            {...register("email")}
          />
        </FormField>

        <FormField
          error={errors.phone}
          htmlFor="phone"
          label="Phone (optional)"
        >
          <Input
            autoComplete="tel"
            id="phone"
            placeholder="+44 7700 900000"
            type="tel"
            {...register("phone")}
          />
        </FormField>

        <FormField error={errors.password} htmlFor="password" label="Password">
          <PasswordInput
            autoComplete="new-password"
            id="password"
            placeholder="At least 8 characters"
            {...register("password")}
          />
        </FormField>

        {role === "customer" ? (
          <FormField
            error={errors.referral_code}
            htmlFor="referral_code"
            label="Referral code (optional)"
          >
            <Input
              autoComplete="off"
              id="referral_code"
              placeholder="Friend’s code"
              {...register("referral_code")}
            />
          </FormField>
        ) : null}

        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting
            ? "Creating account…"
            : role === "cleaner"
              ? "Create cleaner account"
              : "Create customer account"}
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
