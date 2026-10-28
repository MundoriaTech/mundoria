"use client";

import { useState } from "react";

import { useFeedback } from "@/components/shared/feedback-provider";
import { toast } from "@/lib/feedback/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Settings {
  cancellation_window_hours: number;
  geofence_radius_meters: number;
  payment_capture_hour_uk: number;
  payment_capture_minute_uk: number;
  payment_preauth_hours_before: number;
  platform_commission_percent: number;
  support_email: string | null;
}

export function SettingsForm({ initial }: { initial: Settings }) {
  const { success } = useFeedback();
  const [settings, setSettings] = useState({
    cancellation_window_hours: initial.cancellation_window_hours,
    geofence_radius_meters: initial.geofence_radius_meters,
    payment_capture_hour_uk: initial.payment_capture_hour_uk ?? 10,
    payment_capture_minute_uk: initial.payment_capture_minute_uk ?? 0,
    payment_preauth_hours_before: initial.payment_preauth_hours_before ?? 24,
    platform_commission_percent: initial.platform_commission_percent,
    support_email: initial.support_email,
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const response = await fetch("/api/admin/settings", {
      body: JSON.stringify(settings),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { error?: string };
    setSaving(false);

    if (!response.ok) {
      toast.error("Couldn’t save settings", {
        description: result.error ?? "Check the values and try again.",
      });
      return;
    }

    success({
      kind: "saved",
      title: "Settings saved",
      note: "Platform rules are live from here on.",
    });
  }

  return (
    <section className="max-w-2xl space-y-6">
      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <h2 className="text-base font-semibold text-brand-ink">Platform</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
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
      </div>

      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <h2 className="text-base font-semibold text-brand-ink">
          Customer payments
        </h2>
        <p className="mt-1 text-sm leading-6 text-brand-muted">
          Card is saved at booking. Pre-authorisation runs once a cleaner is
          confirmed and the visit is inside this window. Capture runs the next
          UK calendar day after checkout, at the time below.
        </p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field label="Pre-authorise hours before visit">
            <Input
              max={168}
              min={1}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  payment_preauth_hours_before: Number(event.target.value),
                })
              }
              type="number"
              value={settings.payment_preauth_hours_before}
            />
          </Field>
          <Field label="Capture hour (UK, 0–23)">
            <Input
              max={23}
              min={0}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  payment_capture_hour_uk: Number(event.target.value),
                })
              }
              type="number"
              value={settings.payment_capture_hour_uk}
            />
          </Field>
          <Field label="Capture minute (UK, 0–59)">
            <Input
              max={59}
              min={0}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  payment_capture_minute_uk: Number(event.target.value),
                })
              }
              type="number"
              value={settings.payment_capture_minute_uk}
            />
          </Field>
        </div>
      </div>

      <Button loading={saving} loadingLabel="Saving…" onClick={() => void save()}>
        Save settings
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
