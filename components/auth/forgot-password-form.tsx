"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormField } from "@/components/auth/form-field";
import { FormStatus } from "@/components/auth/form-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/auth/schemas";

export function ForgotPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    setFormError(null);
    setSuccess(null);

    const response = await fetch("/api/auth/forgot-password", {
      body: JSON.stringify({ email }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setFormError(result.error ?? "Unable to send reset link.");
      return;
    }

    setSuccess("If an account exists for that email, a reset link is on its way.");
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <FormStatus message={formError} />
      <FormStatus message={success} tone="success" />
      <FormField error={errors.email} htmlFor="email" label="Email">
        <Input
          autoComplete="email"
          id="email"
          placeholder="alex@example.com"
          type="email"
          {...register("email")}
        />
      </FormField>
      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Sending reset link…" : "Send reset link"}
      </Button>
    </form>
  );
}
