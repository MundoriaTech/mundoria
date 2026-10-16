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
import {
  nationalFromPhone,
  storedPhone,
  UK_DIAL_CODE,
} from "@/lib/auth/uk-phone";
import { cn } from "@/lib/utils";

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
  const [nationalNumber, setNationalNumber] = useState(() =>
    nationalFromPhone(defaultPhone),
  );
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setValue,
  } = useForm<CompleteProfileValues>({
    defaultValues: {
      full_name: defaultFullName,
      phone: storedPhone(nationalFromPhone(defaultPhone)),
    },
    resolver: zodResolver(completeProfileSchema),
  });

  function updateNationalNumber(value: string) {
    const national = nationalFromPhone(value)
      .replace(/[^\d\s]/g, "")
      .replace(/^\s+/, "")
      .replace(/\s{2,}/g, " ");
    setNationalNumber(national);
    setValue("phone", storedPhone(national), { shouldDirty: true });
  }

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
      <FormStatus message={formError} title="Couldn’t save your profile" />
      <FormField error={errors.full_name} htmlFor="full_name" label="Full name">
        <Input
          autoComplete="name"
          id="full_name"
          placeholder="Alex Morgan"
          {...register("full_name")}
        />
      </FormField>
      <FormField error={errors.phone} htmlFor="phone" label="Phone number">
        <div className="flex gap-2">
          <span
            className={cn(
              "inline-flex h-11 w-[4.5rem] shrink-0 items-center justify-center rounded-md border border-[#e8e8eb] bg-[#f7f6f8] text-sm font-semibold text-[#1c133b]",
              errors.phone && "border-[#d4694a]",
            )}
          >
            {UK_DIAL_CODE}
          </span>
          <Input
            autoComplete="tel-national"
            className="min-w-0 flex-1"
            id="phone"
            inputMode="tel"
            onChange={(event) => updateNationalNumber(event.target.value)}
            placeholder="7700 900000"
            type="tel"
            value={nationalNumber}
          />
        </div>
        <input type="hidden" {...register("phone")} />
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
