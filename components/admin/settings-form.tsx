"use client";

import { useState } from "react";

import { ActionError } from "@/components/shared/action-error";
import { useFeedback } from "@/components/shared/feedback-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Settings {
  cancellation_window_hours: number;
  geofence_radius_meters: number;
  platform_commission_percent: number;
  support_email: string | null;
}

export function SettingsForm({ initial }: { initial: Settings }) {
  const { success } = useFeedback();
  const [settings, setSettings] = useState(initial);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaveError(null);
    setSaving(true);
    const response = await fetch("/api/admin/settings", {
      body: JSON.stringify(settings),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { error?: string };
    setSaving(false);

    if (!response.ok) {
      setSaveError(result.error ?? "Check the values and try again.");
      return;
    }

    success({
      kind: "saved",
      title: "Settings saved",
      note: "Platform rules are live from here on.",
    });
  }

  return (
    <section className="max-w-2xl rounded-xl border bg-card p-4 sm:p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Platform commission (%)">
          <Input
            max={100}
            min={0}
            onChange={(event) =>
              setSettings({
                ...settings,
                platform_commission_percent: Number(event.target.value),
              })
            }
            type="number"
            value={settings.platform_commission_percent}
          />
        </Field>
        <Field label="Geofence radius (metres)">
          <Input
            min={50}
            onChange={(event) =>
              setSettings({
                ...settings,
                geofence_radius_meters: Number(event.target.value),
              })
            }
            type="number"
            value={settings.geofence_radius_meters}
          />
        </Field>
        <Field label="Cancellation window (hours)">
          <Input
            min={0}
            onChange={(event) =>
              setSettings({
                ...settings,
                cancellation_window_hours: Number(event.target.value),
              })
            }
            type="number"
            value={settings.cancellation_window_hours}
          />
        </Field>
        <Field label="Support email">
          <Input
            onChange={(event) =>
              setSettings({
                ...settings,
                support_email: event.target.value || null,
              })
            }
            type="email"
            value={settings.support_email ?? ""}
          />
        </Field>
      </div>
      {saveError ? (
        <div className="mt-6">
          <ActionError message={saveError} title="Couldn’t save settings" />
        </div>
      ) : null}
      <Button
        className="mt-6 w-full sm:w-auto"
        disabled={saving}
        onClick={() => void save()}
      >
        {saving ? "Saving…" : "Save settings"}
      </Button>
    </section>
  );
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="space-y-2 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}
