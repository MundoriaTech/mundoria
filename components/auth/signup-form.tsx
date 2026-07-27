"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormField } from "@/components/auth/form-field";
import { FormStatus } from "@/components/auth/form-status";
import { OAuthButton } from "@/components/auth/oauth-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dashboardForRole } from "@/lib/auth/redirects";
import {
  signupSchema,
  type SignupValues,
} from "@/lib/auth/schemas";
import type { UserRole } from "@/types/auth";

interface SignupResponse {
  error?: string;
  hasSession?: boolean;
  requiresEmailConfirmation?: boolean;
  role?: UserRole;
}

export function SignupForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setValue,
    watch,
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      phone: "",
      role: "customer",
    },
  });
  const selectedRole = watch("role");

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/auth/signup", {
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await parseSignupResponse(response)) as SignupResponse;

      if (!response.ok || result.error) {
        throw new Error(result.error ?? "Unable to create your account");
      }

      if (result.requiresEmailConfirmation) {
        setSuccess(
          "Account created. Check your inbox to confirm your email, then sign in.",
        );
        return;
      }

      const role = result.role ?? values.role;
      router.replace(dashboardForRole(role));
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
          selectedRole === "cleaner"
            ? "Continue with Google as a cleaner"
            : "Continue with Google as a customer"
        }
        next={dashboardForRole(selectedRole)}
        role={selectedRole}
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

        <FormField error={errors.phone} htmlFor="phone" label="Phone">
          <Input
            autoComplete="tel"
            id="phone"
            placeholder="+44 7700 900000"
            type="tel"
            {...register("phone")}
          />
        </FormField>

        <FormField error={errors.password} htmlFor="password" label="Password">
          <Input
            autoComplete="new-password"
            id="password"
            placeholder="At least 8 characters"
            type="password"
            {...register("password")}
          />
        </FormField>

        <fieldset>
          <legend className="text-sm font-medium">I want to</legend>
          <input type="hidden" {...register("role")} />
          <div
            aria-label="Account type"
            className="mt-2 grid grid-cols-2 gap-3"
            role="radiogroup"
          >
            <RoleOption
              checked={selectedRole === "customer"}
              description="Book trusted cleaners"
              label="Hire a cleaner"
              onSelect={() =>
                setValue("role", "customer", {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                })
              }
              value="customer"
            />
            <RoleOption
              checked={selectedRole === "cleaner"}
              description="Find cleaning work"
              label="Work as a cleaner"
              onSelect={() =>
                setValue("role", "cleaner", {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                })
              }
              value="cleaner"
            />
          </div>
          {errors.role ? (
            <p className="mt-2 text-sm text-destructive" role="alert">
              {errors.role.message}
            </p>
          ) : null}
        </fieldset>

        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </div>
  );
}

function RoleOption({
  checked,
  description,
  label,
  onSelect,
  value,
}: {
  checked: boolean;
  description: string;
  label: string;
  onSelect: () => void;
  value: "customer" | "cleaner";
}) {
  return (
    <button
      aria-checked={checked}
      className={`rounded-lg border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        checked
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "hover:border-primary/50"
      }`}
      onClick={onSelect}
      role="radio"
      type="button"
      value={value}
    >
      <span className="block text-sm font-medium">{label}</span>
      <span className="mt-1 block text-xs text-muted-foreground">
        {description}
      </span>
    </button>
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
