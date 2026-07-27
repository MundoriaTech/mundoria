"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FormField } from "@/components/auth/form-field";
import { FormStatus } from "@/components/auth/form-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { completeProfileSchema, type CompleteProfileValues } from "@/lib/auth/schemas";
import { safeRedirectPath } from "@/lib/auth/redirects";
import { createBrowserClient } from "@/lib/supabase/client";

export function CompleteProfileForm({
  defaultFullName,
  defaultPhone,
  next,
}: {
  defaultFullName: string;
  defaultPhone: string;
  next: string;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<CompleteProfileValues>({
    defaultValues: {
      full_name: defaultFullName,
      phone: defaultPhone,
    },
    resolver: zodResolver(completeProfileSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const response = await fetch("/api/auth/complete-profile", {
      body: JSON.stringify(values),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { error?: string };

    if (!response.ok || result.error) {
      setFormError(result.error ?? "Unable to save your profile.");
      return;
    }

    router.replace(safeRedirectPath(next, "/dashboard"));
    router.refresh();
  });

  async function switchAccount() {
    await createBrowserClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <FormStatus message={formError} />
      <FormField error={errors.full_name} htmlFor="full_name" label="Full name">
        <Input
          autoComplete="name"
          id="full_name"
          placeholder="Alex Morgan"
          {...register("full_name")}
        />
      </FormField>
      <FormField error={errors.phone} htmlFor="phone" label="Phone number">
        <Input
          autoComplete="tel"
          id="phone"
          placeholder="+44 7700 900000"
          type="tel"
          {...register("phone")}
        />
      </FormField>
      <p className="text-sm leading-6 text-muted-foreground">
        We use your phone number for booking updates, cleaner arrival notices,
        and account recovery. SMS verification can be added later when Twilio is
        live.
      </p>
      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Saving…" : "Continue"}
      </Button>
      <Button
        className="w-full"
        disabled={isSubmitting}
        onClick={() => void switchAccount()}
        type="button"
        variant="ghost"
      >
        Use a different account
      </Button>
    </form>
  );
}
