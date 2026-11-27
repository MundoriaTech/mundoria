"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ActionError } from "@/components/shared/action-error";
import { useFeedback } from "@/components/shared/feedback-provider";
import { SimpleSelect } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoundCheckbox } from "@/components/ui/round-checkbox";

const SOURCES = [
  ["phone_call", "Phone call"],
  ["walk_in", "In person"],
  ["referral", "Referral"],
  ["event", "Event"],
  ["social_media", "Social media message"],
  ["other", "Other"],
] as const;

export function AddLeadForm() {
  const router = useRouter();
  const { success } = useFeedback();
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    notes: "",
    phone: "",
    source: "phone_call",
  });
  const [consent, setConsent] = useState({ call: false, email: false, sms: false });
  const [consentNote, setConsentNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const anyConsent = consent.email || consent.sms || consent.call;

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const response = await fetch("/api/admin/leads", {
        body: JSON.stringify({ ...form, consent, consentNote }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json().catch(() => ({}))) as {
        created?: boolean;
        error?: string;
        id?: string;
      };
      if (!response.ok || !result.id) {
        setError(result.error ?? "Couldn’t add this lead.");
        return;
      }
      success({
        kind: result.created ? "saved" : "updated",
        note: result.created
          ? "Start follow-ups from their page when you're ready."
          : "This person was already a lead, so we opened their record.",
        title: result.created ? "Lead added" : "Lead already exists",
      });
      router.push(`/admin/leads/${result.id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-5 rounded-xl border bg-card p-4 sm:p-5" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name">
          <Input onChange={(e) => set("firstName", e.target.value)} required value={form.firstName} />
        </Field>
        <Field label="Last name (optional)">
          <Input onChange={(e) => set("lastName", e.target.value)} value={form.lastName} />
        </Field>
        <Field label="Phone">
          <Input inputMode="tel" onChange={(e) => set("phone", e.target.value)} placeholder="07…" value={form.phone} />
        </Field>
        <Field label="Email">
          <Input inputMode="email" onChange={(e) => set("email", e.target.value)} type="email" value={form.email} />
        </Field>
        <Field label="Where did they come from?">
          <SimpleSelect
            aria-label="Source"
            className="h-11"
            onChange={(value) => set("source", value)}
            options={SOURCES.map(([value, label]) => ({ label, value }))}
            value={form.source}
          />
        </Field>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">Add at least a phone number or an email.</p>

      <Field label="Notes (optional)">
        <textarea
          className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          onChange={(e) => set("notes", e.target.value)}
          placeholder="What they need, home size, preferred days…"
          value={form.notes}
        />
      </Field>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">They agreed to hear from us by</legend>
        <div className="flex flex-wrap gap-4 text-sm">
          {(["email", "sms", "call"] as const).map((channel) => (
            <label className="flex items-center gap-2" key={channel}>
              <RoundCheckbox
                checked={consent[channel]}
                onChange={(e) =>
                  setConsent((current) => ({
                    ...current,
                    [channel]: e.target.checked,
                  }))
                }
              />
              {channel === "sms" ? "Text" : channel === "call" ? "Phone call" : "Email"}
            </label>
          ))}
        </div>
        {anyConsent ? (
          <Input
            onChange={(e) => setConsentNote(e.target.value)}
            placeholder="How they agreed, e.g. said yes on the phone on 25 Nov"
            value={consentNote}
          />
        ) : (
          <p className="text-xs text-muted-foreground">
            Leave these unticked if they didn&apos;t agree. You can still reply to them directly.
          </p>
        )}
      </fieldset>

      {error ? <ActionError message={error} title="Couldn’t add this lead" /> : null}
      <Button disabled={busy} type="submit">
        {busy ? "Adding…" : "Add lead"}
      </Button>
    </form>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="block space-y-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}
