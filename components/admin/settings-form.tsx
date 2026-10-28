"use client";

import { useMemo, useState } from "react";

import { ActionError } from "@/components/shared/action-error";
import { useFeedback } from "@/components/shared/feedback-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ADMIN_FLAT_ADD_ONS,
  ADMIN_PRICING_SERVICES,
  DEFAULT_SERVICE_PRICING,
  normalizeServicePricing,
  type HourlyBand,
  type ServicePricingConfig,
} from "@/lib/customer/pricing-config";
import type { ServiceType } from "@/types/customer";

interface Settings {
  cancellation_window_hours: number;
  geofence_radius_meters: number;
  payment_capture_hour_uk: number;
  payment_capture_minute_uk: number;
  payment_preauth_hours_before: number;
  platform_commission_percent: number;
  service_pricing?: unknown;
  support_email: string | null;
}

function penceToPoundsInput(pence: number) {
  return (Math.round(pence) / 100).toFixed(2);
}

function poundsInputToPence(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export function SettingsForm({ initial }: { initial: Settings | null }) {
  const { success } = useFeedback();
  const [settings, setSettings] = useState({
    cancellation_window_hours: initial?.cancellation_window_hours ?? 48,
    geofence_radius_meters: initial?.geofence_radius_meters ?? 150,
    payment_capture_hour_uk: initial?.payment_capture_hour_uk ?? 10,
    payment_capture_minute_uk: initial?.payment_capture_minute_uk ?? 0,
    payment_preauth_hours_before: initial?.payment_preauth_hours_before ?? 24,
    platform_commission_percent: initial?.platform_commission_percent ?? 20,
    support_email: initial?.support_email ?? null,
  });
  const [pricing, setPricing] = useState<ServicePricingConfig>(() =>
    normalizeServicePricing(initial?.service_pricing),
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const serviceRows = useMemo(() => ADMIN_PRICING_SERVICES, []);

  function bandFor(service: ServiceType): HourlyBand {
    return pricing.hourly[service] ?? pricing.defaults;
  }

  function setBand(
    service: ServiceType,
    key: keyof HourlyBand,
    pounds: string,
  ) {
    const current = bandFor(service);
    setPricing((prev) => ({
      ...prev,
      hourly: {
        ...prev.hourly,
        [service]: {
          ...current,
          [key]: poundsInputToPence(pounds),
        },
      },
    }));
  }

  async function save() {
    setSaveError(null);
    setSaving(true);
    const response = await fetch("/api/admin/settings", {
      body: JSON.stringify({
        ...settings,
        service_pricing: pricing,
      }),
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
      note: "Platform rules and service prices are live from here on.",
    });
  }

  return (
    <section className="max-w-4xl space-y-6">
      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <h2 className="text-base font-semibold text-[#1c133b]">Platform</h2>
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
        <h2 className="text-base font-semibold text-[#1c133b]">
          Service hourly rates (£/h)
        </h2>
        <p className="mt-1 text-sm leading-6 text-[#5a5470]">
          Two labour bands per service. Standard is the everyday rate; deep is
          used for heavier cleans. Amounts are pounds per cleaner-hour.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b text-[#5a5470]">
                <th className="py-2 pr-3 font-medium">Service</th>
                <th className="py-2 pr-3 font-medium">Standard</th>
                <th className="py-2 font-medium">Deep</th>
              </tr>
            </thead>
            <tbody>
              {serviceRows.map((service) => {
                const band = bandFor(service.value);
                return (
                  <tr className="border-b border-border/60" key={service.value}>
                    <td className="py-2.5 pr-3 font-medium text-[#1c133b]">
                      {service.label}
                    </td>
                    <td className="py-2.5 pr-3">
                      <Input
                        className="h-9 w-24"
                        min={0}
                        onChange={(event) =>
                          setBand(service.value, "standard", event.target.value)
                        }
                        step="0.01"
                        type="number"
                        value={penceToPoundsInput(band.standard)}
                      />
                    </td>
                    <td className="py-2.5">
                      <Input
                        className="h-9 w-24"
                        min={0}
                        onChange={(event) =>
                          setBand(service.value, "deep", event.target.value)
                        }
                        step="0.01"
                        type="number"
                        value={penceToPoundsInput(band.deep)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <h2 className="text-base font-semibold text-[#1c133b]">
          Supply rates (£/h)
        </h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field label="Cleaning products — home">
            <Input
              min={0}
              onChange={(event) =>
                setPricing((prev) => ({
                  ...prev,
                  supply: {
                    ...prev.supply,
                    productsResidential: poundsInputToPence(event.target.value),
                  },
                }))
              }
              step="0.01"
              type="number"
              value={penceToPoundsInput(pricing.supply.productsResidential)}
            />
          </Field>
          <Field label="Cleaning products — commercial">
            <Input
              min={0}
              onChange={(event) =>
                setPricing((prev) => ({
                  ...prev,
                  supply: {
                    ...prev.supply,
                    productsCommercial: poundsInputToPence(event.target.value),
                  },
                }))
              }
              step="0.01"
              type="number"
              value={penceToPoundsInput(pricing.supply.productsCommercial)}
            />
          </Field>
          <Field label="Equipment — standard">
            <Input
              min={0}
              onChange={(event) =>
                setPricing((prev) => ({
                  ...prev,
                  supply: {
                    ...prev.supply,
                    equipmentDefault: poundsInputToPence(event.target.value),
                  },
                }))
              }
              step="0.01"
              type="number"
              value={penceToPoundsInput(pricing.supply.equipmentDefault)}
            />
          </Field>
          <Field label="Equipment — deep clean">
            <Input
              min={0}
              onChange={(event) =>
                setPricing((prev) => ({
                  ...prev,
                  supply: {
                    ...prev.supply,
                    equipmentDeepClean: poundsInputToPence(event.target.value),
                  },
                }))
              }
              step="0.01"
              type="number"
              value={penceToPoundsInput(pricing.supply.equipmentDeepClean)}
            />
          </Field>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <h2 className="text-base font-semibold text-[#1c133b]">
          Flat add-on prices (£)
        </h2>
        <p className="mt-1 text-sm leading-6 text-[#5a5470]">
          Fixed extras charged on top of labour time (ironing still adds time at
          checkout; set £0 here if it is time-only).
        </p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {ADMIN_FLAT_ADD_ONS.map((addOn) => (
            <Field key={addOn.id} label={addOn.label}>
              <Input
                min={0}
                onChange={(event) =>
                  setPricing((prev) => ({
                    ...prev,
                    addOns: {
                      ...prev.addOns,
                      [addOn.id]: poundsInputToPence(event.target.value),
                    },
                  }))
                }
                step="0.01"
                type="number"
                value={penceToPoundsInput(
                  pricing.addOns[addOn.id] ??
                    DEFAULT_SERVICE_PRICING.addOns[addOn.id] ??
                    0,
                )}
              />
            </Field>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <h2 className="text-base font-semibold text-[#1c133b]">
          Schedule price multipliers
        </h2>
        <p className="mt-1 text-sm leading-6 text-[#5a5470]">
          Multipliers on labour (1.0 = normal). Example: 1.15 = +15%.
        </p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {(
            [
              ["early", "Early weekday (before 9:00)"],
              ["evening", "Evening weekday (from 17:00)"],
              ["weekend", "Weekend daytime"],
              ["weekendPeak", "Weekend peak (early/evening)"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <Input
                max={3}
                min={1}
                onChange={(event) =>
                  setPricing((prev) => ({
                    ...prev,
                    schedule: {
                      ...prev.schedule,
                      [key]: Number(event.target.value),
                    },
                  }))
                }
                step="0.01"
                type="number"
                value={pricing.schedule[key]}
              />
            </Field>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <h2 className="text-base font-semibold text-[#1c133b]">
          Customer payments
        </h2>
        <p className="mt-1 text-sm leading-6 text-[#5a5470]">
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

      {saveError ? (
        <ActionError message={saveError} title="Couldn’t save settings" />
      ) : null}
      <Button disabled={saving} onClick={() => void save()}>
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
