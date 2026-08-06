"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormField } from "@/components/auth/form-field";
import { FormStatus } from "@/components/auth/form-status";
import { OAuthButton } from "@/components/auth/oauth-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dashboardForRole, safeRedirectPath } from "@/lib/auth/redirects";
import { loginSchema, type LoginValues } from "@/lib/auth/schemas";
import { createBrowserClient } from "@/lib/supabase/client";
import { isUserRole } from "@/types/auth";

interface LoginFormProps {
  initialError?: string;
  initialMessage?: string;
  requiredRole?: "admin";
  redirectTo?: string;
  showOAuth?: boolean;
}

export function LoginForm({
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
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

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
      setFormError("This sign-in page is only for CleanScape administrators.");
      return;
    }

    const dashboard = dashboardForRole(profile.role);
    router.replace(safeRedirectPath(redirectTo ?? null, dashboard));
    router.refresh();
  });

  return (
    <div className="space-y-6">
      {showOAuth ? (
        <>
          <OAuthButton next={safeRedirectPath(redirectTo ?? null, "/dashboard")} />
          <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or use email
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      ) : null}

      <form className="space-y-5" onSubmit={onSubmit}>
        <FormStatus message={formError} />
        <FormStatus message={initialMessage ?? null} tone="success" />

        <FormField error={errors.email} htmlFor="email" label="Email">
          <Input
            autoComplete="email"
            id="email"
            placeholder="alex@example.com"
            type="email"
            {...register("email")}
          />
        </FormField>

        <FormField error={errors.password} htmlFor="password" label="Password">
          <Input
            autoComplete="current-password"
            id="password"
            type="password"
            {...register("password")}
          />
        </FormField>

        <div className="text-right">
          <Link
            className="text-sm font-medium text-primary hover:underline"
            href={
              requiredRole === "admin"
                ? "/forgot-password?from=admin"
                : "/forgot-password"
            }
          >
            Forgot password?
          </Link>
        </div>

        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
