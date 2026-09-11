"use client";

import { Repeat2 } from "lucide-react";

export interface RecurringValue {
  enabled: boolean;
  frequency: "weekly" | "fortnightly" | "monthly" | "custom" | null;
  preferSameCleaner: boolean;
}

export function RecurringToggle({
  onChange,
  value,
}: {
  onChange: (value: RecurringValue) => void;
  value: RecurringValue;
}) {
  return (
    <div className="space-y-4 rounded-xl bg-muted/50 p-4">
      <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 text-sm font-medium">
        <span className="flex items-center gap-2">
          <Repeat2 className="h-4 w-4 shrink-0 text-primary" />
          Make this a recurring booking
        </span>
        <input
          checked={value.enabled}
          className="h-4 w-4 accent-emerald-700"
          onChange={(event) =>
            onChange({
              ...value,
              enabled: event.target.checked,
              frequency: event.target.checked ? value.frequency : null,
              preferSameCleaner: false,
            })
          }
          type="checkbox"
        />
      </label>
      {value.enabled ? (
        <select
          aria-label="Recurring frequency"
          className="h-11 w-full rounded-md border bg-background px-3 text-sm"
          onChange={(event) =>
            onChange({
              ...value,
              frequency: event.target.value as RecurringValue["frequency"],
              preferSameCleaner: false,
            })
          }
          value={value.frequency ?? ""}
        >
          <option disabled value="">
            Choose frequency
          </option>
          <option value="weekly">Weekly</option>
          <option value="fortnightly">Fortnightly</option>
          <option value="monthly">Monthly</option>
          <option value="custom">Customize your calendar</option>
        </select>
      ) : null}
    </div>
  );
}
