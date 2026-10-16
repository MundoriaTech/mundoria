"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { FormField } from "@/components/auth/form-field";
import { PasswordRequirementsList } from "@/components/auth/password-requirements";
import { FormStatus } from "@/components/auth/form-status";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import {
  updatePasswordSchema,
  type UpdatePasswordValues,
} from "@/lib/auth/schemas";
import { createBrowserClient } from "@/lib/supabase/client";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<UpdatePasswordValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const passwordValue = useWatch({ control, name: "password", defaultValue: "" });

  const onSubmit = handleSubmit(async ({ password }) => {
    setFormError(null);
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setFormError(error.message);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = user
      ? await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle()
      : { data: null };

    await fetch("/api/auth/password-updated", { method: "POST" });
    await supabase.auth.signOut();

    const loginPath =
      profile?.role === "admin"
        ? "/admin/login"
        : profile?.role === "cleaner"
          ? "/login/cleaner"
          : "/login";
    router.replace(
      `${loginPath}?message=${encodeURIComponent("Password updated. You can sign in.")}`,
    );
    router.refresh();
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <FormStatus message={formError} title="Couldn’t update your password" />
      <div className="space-y-2">
        <FormField error={errors.password} htmlFor="password" label="New password">
          <PasswordInput
            autoComplete="new-password"
            id="password"
            placeholder="Create a password"
            {...register("password")}
          />
        </FormField>
        <PasswordRequirementsList password={passwordValue ?? ""} />
      </div>
      <FormField
        error={errors.confirmPassword}
        htmlFor="confirmPassword"
        label="Confirm new password"
      >
        <PasswordInput
          autoComplete="new-password"
          id="confirmPassword"
          {...register("confirmPassword")}
        />
      </FormField>
      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Updating password…" : "Update password"}
      </Button>
    </form>
  );
}
