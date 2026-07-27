"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormField } from "@/components/auth/form-field";
import { FormStatus } from "@/components/auth/form-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminInviteAcceptForm({
  email,
  initialFullName,
  token,
}: {
  email: string;
  initialFullName?: string | null;
  token: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialFullName ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function acceptInvitation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/admin-invite/accept", {
        body: JSON.stringify({
          full_name: fullName,
          password,
          token,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok || result.error) {
        throw new Error(result.error ?? "Unable to accept invitation.");
      }

      router.replace(
        "/admin/login?message=Admin%20account%20created.%20Sign%20in%20to%20continue.",
      );
      router.refresh();
    } catch (acceptError) {
      setError(
        acceptError instanceof Error
          ? acceptError.message
          : "Unable to accept invitation.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={acceptInvitation}>
      <FormStatus message={error} />

      <div className="rounded-xl border bg-muted/40 p-4 text-sm">
        <p className="font-medium">Admin invitation for</p>
        <p className="mt-1 text-muted-foreground">{email}</p>
      </div>

      <FormField htmlFor="full_name" label="Full name">
        <Input
          autoComplete="name"
          id="full_name"
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Alex Morgan"
          required
          value={fullName}
        />
      </FormField>

      <FormField htmlFor="password" label="Create password">
        <Input
          autoComplete="new-password"
          id="password"
          minLength={8}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters"
          required
          type="password"
          value={password}
        />
      </FormField>

      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Creating admin account…" : "Accept invitation"}
      </Button>
    </form>
  );
}
