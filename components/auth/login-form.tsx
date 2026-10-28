"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { FormField } from "@/components/auth/form-field";
import { FormStatus } from "@/components/auth/form-status";
import { OAuthButton } from "@/components/auth/oauth-button";
import { PasswordRequirementsList } from "@/components/auth/password-requirements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { dashboardForRole, redirectForRole } from "@/lib/auth/redirects";
import { SIGNUP_EMAIL_SESSION_KEY } from "@/lib/auth/signup-email-pending";
import { loginSchema, type LoginValues } from "@/lib/auth/schemas";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { isUserRole } from "@/types/auth";

interface LoginFormProps {
  initialEmail?: string;
  initialError?: string;
  initialMessage?: string;
  requiredRole?: "admin" | "cleaner" | "customer";
  redirectTo?: string;
  showOAuth?: boolean;
}

export function LoginForm({
  initialEmail,
  initialError,
  initialMessage,
  requiredRole,
  redirectTo,
  showOAuth = true,
}: LoginFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(
    initialError ?? null,
  );
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setValue,
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: initialEmail ?? "", password: "" },
  });
  const passwordValue = useWatch({ control, name: "password", defaultValue: "" });

  useEffect(() => {
    if (initialEmail) return;
    const stored = window.sessionStorage.getItem(SIGNUP_EMAIL_SESSION_KEY);
    if (!stored) return;
    setValue("email", stored);
    window.sessionStorage.removeItem(SIGNUP_EMAIL_SESSION_KEY);
  }, [initialEmail, setValue]);

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFormError(null);
    const supabase = createBrowserClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setFormError(error.message);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError || !isUserRole(profile?.role)) {
      await supabase.auth.signOut();
      setFormError("Your account profile could not be loaded.");
      return;
    }

    if (requiredRole && profile.role !== requiredRole) {
      await supabase.auth.signOut();
      setFormError(
        requiredRole === "admin"
          ? "This sign-in page is only for Mundoria administrators."
          : requiredRole === "cleaner"
            ? "This email is a customer account. Use customer sign-in."
            : "This email is a cleaner account. Use cleaner sign-in.",
      );
      return;
    }

    const dashboard = dashboardForRole(profile.role);
    router.replace(redirectForRole(profile.role, redirectTo ?? null, dashboard));
    router.refresh();
  });

  return (
    <div className="space-y-6">
      {showOAuth ? (
        <>
          <OAuthButton
            className="h-12 rounded-xl border-[#ddd6eb] bg-white text-[#414141] hover:bg-white/90"
            label="Continue with Google"
            next={
              requiredRole === "cleaner"
                ? "/cleaner/dashboard"
                : redirectForRole("customer", redirectTo ?? null, "/dashboard")
            }
            role={requiredRole === "cleaner" ? "cleaner" : "customer"}
          />
          <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.14em] text-[#9a93ad]">
            <span className="h-px flex-1 bg-[#ddd6eb]" />
            or use email
            <span className="h-px flex-1 bg-[#ddd6eb]" />
          </div>
        </>
      ) : null}

      <form className="space-y-5" onSubmit={onSubmit}>
        <FormStatus message={formError} title="Couldn’t sign you in" />
        <FormStatus message={initialMessage ?? null} tone="success" />

        <FormField error={errors.email} htmlFor="email" label="Email">
          <Input
            autoComplete="email"
            id="email"
            placeholder=" "
            type="email"
            {...register("email")}
          />
        </FormField>

        <div className="space-y-2">
          <FormField error={errors.password} htmlFor="password" label="Password">
            <PasswordInput
              autoComplete="current-password"
              id="password"
              placeholder=" "
              {...register("password")}
            />
          </FormField>
          <PasswordRequirementsList password={passwordValue ?? ""} />
        </div>

        <div className="text-right">
          <Link
            className="text-sm font-medium text-brand-plum hover:underline"
            href={forgotPasswordHref(requiredRole, redirectTo)}
          >
            Forgot Password?
          </Link>
        </div>

        <Button
          className={cn(
            "h-12 w-full rounded-xl bg-brand-plum text-base font-semibold text-white hover:bg-brand-plum/90",
          )}
          loading={isSubmitting}
          loadingLabel="Signing in…"
          type="submit"
        >
          Log in
        </Button>
      </form>
    </div>
  );
}

function forgotPasswordHref(
  requiredRole: LoginFormProps["requiredRole"],
  redirectTo?: string,
) {
  const params = new URLSearchParams();
  if (requiredRole === "admin") params.set("from", "admin");
  if (requiredRole === "cleaner") params.set("from", "cleaner");
  if (
    redirectTo &&
    redirectTo.startsWith("/") &&
    !redirectTo.startsWith("//")
  ) {
    params.set("redirectTo", redirectTo);
  }
  const query = params.toString();
  return query ? `/forgot-password?${query}` : "/forgot-password";
}
