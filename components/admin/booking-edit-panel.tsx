"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ActionError } from "@/components/shared/action-error";
import { useFeedback } from "@/components/shared/feedback-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimpleSelect } from "@/components/ui/select";

export type BookingEditValues = {
  accessInstructions: string;
  addOns: string[];
  addressId: string;
  bathrooms: number;
  bedrooms: number;
  cleaningStandard: string;
  durationHours: number;
  otherRooms: number;
  scheduledDate: string;
  scheduledTime: string;
  specialInstructions: string;
};

type Preview = {
  changes: Array<{ field: string; from: string; to: string }>;
  cleanerMustReconfirm: boolean;
  holdNeedsReplacing: boolean;
  newTotalPence: number;
  oldTotalPence: number;
};

const field = "flex flex-col gap-1 text-sm";
const labelText = "text-xs font-medium text-muted-foreground";
const textArea =
  "min-h-[72px] w-full rounded-md border border-[#e8e8eb] bg-white px-3 py-2 text-sm text-[#1c133b] outline-none focus:border-[#524096]";

const LENGTHS = Array.from({ length: 31 }, (_, i) => 1 + i * 0.5);

const money = (pence: number) => `£${(pence / 100).toFixed(2)}`;

/**
 * Change a booking on the customer's behalf: when, where, what's cleaned and
 * the notes. "Check changes" shows the new price and who will be told before
 * anything is saved.
 */
export function BookingEditPanel({
  addOnOptions,
  addresses,
  bookingId,
  hasCleaner,
  initial,
  isOffice,
  notesOnly,
}: {
  addOnOptions: Array<{ id: string; label: string }>;
  addresses: Array<{ id: string; label: string }>;
  bookingId: string;
  hasCleaner: boolean;
  initial: BookingEditValues;
  isOffice: boolean;
  notesOnly: boolean;
}) {
  const router = useRouter();
  const { confirm, success } = useFeedback();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<BookingEditValues>(initial);
  const [priceOverride, setPriceOverride] = useState("");
  const [cleanerAgreed, setCleanerAgreed] = useState(false);
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  function set<K extends keyof BookingEditValues>(key: K, value: BookingEditValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setPreview(null);
  }

  function payload(previewOnly: boolean) {
    const overridePence = priceOverride.trim()
      ? Math.round(Number(priceOverride.replace(/[£,\s]/g, "")) * 100)
      : null;
    return {
      accessInstructions: values.accessInstructions.trim() || null,
      cleanerAgreed,
      note,
      preview: previewOnly,
      priceOverridePence: overridePence,
      specialInstructions: values.specialInstructions.trim() || null,
      ...(notesOnly
        ? {}
        : {
            addressId: values.addressId,
            scheduledDate: values.scheduledDate,
            scheduledTime: values.scheduledTime,
            ...(isOffice
              ? {}
              : {
                  addOns: values.addOns,
                  bathrooms: values.bathrooms,
                  bedrooms: values.bedrooms,
                  cleaningStandard: values.cleaningStandard,
                  durationHours: values.durationHours,
                  otherRooms: values.otherRooms,
                }),
          }),
    };
  }

  async function send(previewOnly: boolean) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/edit`, {
        body: JSON.stringify(payload(previewOnly)),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json().catch(() => ({}))) as Preview & { error?: string };
      if (!response.ok) {
        setMessage(result.error ?? "Check the details and try again.");
        return null;
      }
      return result;
    } finally {
      setBusy(false);
    }
  }

  async function check() {
    const result = await send(true);
    if (result) setPreview(result);
  }

  async function save() {
    if (!preview?.changes.length) return;
    const ok = await confirm({
      action: "Save changes",
      description: [
        "The customer is told what changed.",
        preview.cleanerMustReconfirm
          ? "The cleaner is asked to accept the new details again; the visit isn't confirmed until they do."
          : hasCleaner
            ? "The cleaner is told what changed."
            : null,
        preview.holdNeedsReplacing
          ? `The card hold is replaced with one for ${money(preview.newTotalPence)}.`
          : null,
      ]
        .filter(Boolean)
        .join(" "),
      title: "Save these changes?",
    });
    if (!ok) return;
    const result = await send(false);
    if (!result) return;
    success({
      kind: "updated",
      note: "The customer has been told, and the change is in the audit trail.",
      title: "Booking updated",
    });
    setPreview(null);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <section className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Edit booking</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Change the time, address, length, rooms, extras or notes for the customer.
            </p>
          </div>
          <Button className="min-h-11" onClick={() => setOpen(true)} variant="outline">
            Edit booking
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Edit booking</h2>
        <Button
          onClick={() => {
            setOpen(false);
            setValues(initial);
            setPreview(null);
            setMessage("");
          }}
          size="sm"
          variant="ghost"
        >
          Close
        </Button>
      </div>
      {notesOnly ? (
        <p className="mt-2 text-sm text-muted-foreground">
          The cleaner is on the way or cleaning, so only the notes can change.
        </p>
      ) : isOffice ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Office visits are priced from their spaces: their length and extras can&apos;t change here.
        </p>
      ) : null}

      {!notesOnly ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className={field}>
            <span className={labelText}>Date</span>
            <Input
              onChange={(event) => set("scheduledDate", event.target.value)}
              type="date"
              value={values.scheduledDate}
            />
          </label>
          <label className={field}>
            <span className={labelText}>Start time</span>
            <Input
              onChange={(event) => set("scheduledTime", event.target.value)}
              step={900}
              type="time"
              value={values.scheduledTime}
            />
          </label>
          <div className={`${field} sm:col-span-2`}>
            <span className={labelText}>Address (customer&apos;s saved addresses)</span>
            <SimpleSelect
              aria-label="Address"
              className="h-11 w-full rounded-md border-[#e8e8eb] text-[#1c133b]"
              onChange={(value) => set("addressId", value)}
              options={addresses.map((address) => ({ label: address.label, value: address.id }))}
              value={values.addressId}
            />
          </div>
          {!isOffice ? (
            <>
              <div className={field}>
                <span className={labelText}>Length on site</span>
                <SimpleSelect
                  aria-label="Length"
                  className="h-11 w-full rounded-md border-[#e8e8eb] text-[#1c133b]"
                  onChange={(value) => set("durationHours", Number(value))}
                  options={Array.from(new Set([...LENGTHS, values.durationHours]))
                    .sort((a, b) => a - b)
                    .map((hours) => ({ label: `${hours} hours`, value: String(hours) }))}
                  value={String(values.durationHours)}
                />
              </div>
              <div className={field}>
                <span className={labelText}>Cleaning standard</span>
                <SimpleSelect
                  aria-label="Cleaning standard"
                  className="h-11 w-full rounded-md border-[#e8e8eb] text-[#1c133b]"
                  onChange={(value) => set("cleaningStandard", value)}
                  options={[
                    { label: "Essential", value: "essential" },
                    { label: "Enhanced", value: "enhanced" },
                    { label: "Comprehensive", value: "comprehensive" },
                  ]}
                  value={values.cleaningStandard}
                />
              </div>
              <div className="grid grid-cols-3 gap-3 sm:col-span-2">
                {(
                  [
                    ["bedrooms", "Bedrooms"],
                    ["bathrooms", "Bathrooms"],
                    ["otherRooms", "Other rooms"],
                  ] as const
                ).map(([key, label]) => (
                  <label className={field} key={key}>
                    <span className={labelText}>{label}</span>
                    <Input
                      inputMode="numeric"
                      max={20}
                      min={0}
                      onChange={(event) => set(key, Math.max(0, Number(event.target.value) || 0))}
                      type="number"
                      value={values[key]}
                    />
                  </label>
                ))}
              </div>
              {addOnOptions.length ? (
                <fieldset className="sm:col-span-2">
                  <legend className={labelText}>Extras</legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {addOnOptions.map((addOn) => (
                      <label className="flex items-center gap-2 text-sm" key={addOn.id}>
                        <input
                          checked={values.addOns.includes(addOn.id)}
                          className="accent-primary"
                          onChange={() =>
                            set(
                              "addOns",
                              values.addOns.includes(addOn.id)
                                ? values.addOns.filter((id) => id !== addOn.id)
                                : [...values.addOns, addOn.id],
                            )
                          }
                          type="checkbox"
                        />
                        {addOn.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 grid gap-3">
        <label className={field}>
          <span className={labelText}>Customer notes</span>
          <textarea
            className={textArea}
            maxLength={2000}
            onChange={(event) => set("specialInstructions", event.target.value)}
            value={values.specialInstructions}
          />
        </label>
        <label className={field}>
          <span className={labelText}>Access instructions (keys, door codes, parking)</span>
          <textarea
            className={textArea}
            maxLength={1000}
            onChange={(event) => set("accessInstructions", event.target.value)}
            value={values.accessInstructions}
          />
        </label>
        {!notesOnly ? (
          <label className={field}>
            <span className={labelText}>
              Set the price yourself (optional, £). Leave empty to use the recalculated price.
            </span>
            <Input
              inputMode="decimal"
              onChange={(event) => {
                setPriceOverride(event.target.value);
                setPreview(null);
              }}
              placeholder="e.g. 65.00"
              value={priceOverride}
            />
          </label>
        ) : null}
        {hasCleaner && !notesOnly ? (
          <label className="flex items-start gap-2 text-sm">
            <input
              checked={cleanerAgreed}
              className="mt-0.5 accent-primary"
              onChange={(event) => {
                setCleanerAgreed(event.target.checked);
                setPreview(null);
              }}
              type="checkbox"
            />
            <span>
              I&apos;ve already agreed the new time or address with the cleaner. Leave unticked to ask them
              to accept it again in the app.
            </span>
          </label>
        ) : null}
        <Input
          onChange={(event) => {
            setNote(event.target.value);
            setPreview(null);
          }}
          placeholder="Reason for the change (required, kept in the audit trail)"
          value={note}
        />
      </div>

      {preview ? (
        <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3 text-sm">
          {preview.changes.length ? (
            <>
              <p className="font-semibold">What will change</p>
              <ul className="mt-2 space-y-1">
                {preview.changes.map((change) => (
                  <li key={change.field}>
                    <span className="text-muted-foreground">{change.field}:</span> {change.from} →{" "}
                    <span className="font-medium">{change.to}</span>
                  </li>
                ))}
              </ul>
              {preview.cleanerMustReconfirm ? (
                <p className="mt-2 text-amber-800">
                  The cleaner will be asked to accept the new details. Until they do, the booking shows as
                  matched, not confirmed.
                </p>
              ) : null}
              {preview.holdNeedsReplacing ? (
                <p className="mt-2 text-amber-800">
                  The card is already held for {money(preview.oldTotalPence)}. It will be held for{" "}
                  {money(preview.newTotalPence)} instead; if the bank refuses, nothing changes.
                </p>
              ) : null}
            </>
          ) : (
            <p>Nothing has changed yet.</p>
          )}
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          className="min-h-11 w-full sm:w-auto"
          disabled={busy || note.trim().length < 3}
          onClick={() => void check()}
          variant="outline"
        >
          Check changes
        </Button>
        <Button
          className="min-h-11 w-full sm:w-auto"
          disabled={busy || !preview?.changes.length || note.trim().length < 3}
          onClick={() => void save()}
        >
          Save changes
        </Button>
      </div>
      {message ? (
        <div className="mt-3">
          <ActionError message={message} title="Couldn’t edit this booking" />
        </div>
      ) : null}
    </section>
  );
}
