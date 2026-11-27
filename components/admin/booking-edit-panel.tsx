"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";

import { ActionError } from "@/components/shared/action-error";
import { useFeedback } from "@/components/shared/feedback-provider";
import { Button } from "@/components/ui/button";
import { dayWindowSlots } from "@/components/shared/time-slot-picker";
import { Input } from "@/components/ui/input";
import { RoundCheckbox } from "@/components/ui/round-checkbox";
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

type SavedAddress = { city?: string; id: string; label: string; line1?: string; line2?: string; postcode?: string };

type CorrectionPreview = {
  changes: Array<{ field: string; from: string; to: string }>;
  totalBookings: number;
  upcoming: Array<{ date: string; hasCleaner: boolean; id: string; status: string; time: string }>;
};

const EMPTY_ADDRESS = { city: "", house: "", postcode: "", street: "" };
const labelText = "text-xs font-medium text-muted-foreground";
const textArea =
  "min-h-[72px] w-full rounded-md border border-[#e8e8eb] bg-white px-3 py-2 text-sm text-[#1c133b] outline-none focus:border-[#524096]";

const LENGTHS = Array.from({ length: 31 }, (_, i) => 1 + i * 0.5);
const selectClass = "h-11 w-full rounded-md border-[#e8e8eb] text-[#1c133b]";

/** YYYY-MM-DD for a local date. */
function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** The next 90 days, plus the booking's current date if it falls outside them. */
function dateOptions(current: string) {
  const today = new Date();
  const keys = Array.from({ length: 90 }, (_, i) =>
    dateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)),
  );
  if (current && !keys.includes(current)) keys.push(current);
  return keys.sort().map((key) => {
    const [year, month, day] = key.split("-").map(Number);
    const label = new Date(year, month - 1, day).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      weekday: "short",
      ...(year !== today.getFullYear() ? { year: "numeric" } : {}),
    });
    return { label: key === dateKey(today) ? `Today, ${label}` : label, value: key };
  });
}

/** Half-hour start times, plus the booking's current time if it's off the grid. */
function timeOptions(current: string) {
  const slots = Array.from(new Set([...dayWindowSlots, ...(current ? [current] : [])])).sort();
  return slots.map((slot) => ({ label: slot, value: slot }));
}

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
  customerId,
  hasCleaner,
  initial,
  isOffice,
  notesOnly,
}: {
  addOnOptions: Array<{ id: string; label: string }>;
  addresses: SavedAddress[];
  bookingId: string;
  customerId: string;
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
  const [addressList, setAddressList] = useState(addresses);
  const [addingAddress, setAddingAddress] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const [correction, setCorrection] = useState({ city: "", line1: "", line2: "", note: "", postcode: "" });
  const [correctionPreview, setCorrectionPreview] = useState<CorrectionPreview | null>(null);
  const [newAddress, setNewAddress] = useState(EMPTY_ADDRESS);
  const [addressBusy, setAddressBusy] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [showPrice, setShowPrice] = useState(false);

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
                  // Unchanged length lets extras add their own time.
                  durationHours:
                    values.durationHours !== initial.durationHours ? values.durationHours : undefined,
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

  async function saveNewAddress() {
    setAddressBusy(true);
    setAddressError("");
    try {
      const response = await fetch(`/api/admin/customers/${customerId}/addresses`, {
        body: JSON.stringify({
          ...newAddress,
          bathrooms: values.bathrooms,
          bedrooms: values.bedrooms,
          otherRooms: values.otherRooms,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json().catch(() => ({}))) as {
        address?: { id: string; label: string };
        error?: string;
      };
      if (!response.ok || !result.address) {
        setAddressError(result.error ?? "Couldn't save the address.");
        return;
      }
      setAddressList((list) => [...list, result.address!]);
      set("addressId", result.address.id);
      setAddingAddress(false);
      setNewAddress(EMPTY_ADDRESS);
    } finally {
      setAddressBusy(false);
    }
  }

  function startCorrection() {
    const current = addressList.find((address) => address.id === values.addressId);
    setCorrection({
      city: current?.city ?? "",
      line1: current?.line1 ?? current?.label ?? "",
      line2: current?.line2 ?? "",
      note: "",
      postcode: current?.postcode ?? "",
    });
    setCorrectionPreview(null);
    setAddressError("");
    setAddingAddress(false);
    setCorrecting(true);
  }

  function updateCorrection(key: keyof typeof correction, value: string) {
    setCorrection((current) => ({ ...current, [key]: value }));
    setCorrectionPreview(null);
  }

  async function sendCorrection(previewOnly: boolean) {
    setAddressBusy(true);
    setAddressError("");
    try {
      const response = await fetch(`/api/admin/addresses/${values.addressId}`, {
        body: JSON.stringify({
          addressLine1: correction.line1,
          addressLine2: correction.line2 || null,
          city: correction.city,
          note: correction.note,
          postcode: correction.postcode,
          preview: previewOnly,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const result = (await response.json().catch(() => ({}))) as CorrectionPreview & {
        address?: { id: string; label: string };
        error?: string;
      };
      if (!response.ok) {
        setAddressError(result.error ?? "Couldn't correct the address.");
        return null;
      }
      return result;
    } finally {
      setAddressBusy(false);
    }
  }

  async function checkCorrection() {
    const result = await sendCorrection(true);
    if (result) setCorrectionPreview(result);
  }

  async function saveCorrection() {
    if (!correctionPreview?.changes.length) return;
    const others = correctionPreview.totalBookings;
    const ok = await confirm({
      action: "Correct address",
      description: `This changes the saved address itself, for all ${others} booking${
        others === 1 ? "" : "s"
      } that use it, past ones included. The customer and the cleaners on upcoming visits are told.`,
      title: "Correct this address?",
    });
    if (!ok) return;
    const result = await sendCorrection(false);
    if (!result?.address) return;
    const label = result.address.label;
    setAddressList((list) =>
      list.map((address) =>
        address.id === values.addressId
          ? { ...address, city: correction.city, label, line1: correction.line1, line2: correction.line2, postcode: correction.postcode.toUpperCase() }
          : address,
      ),
    );
    setCorrecting(false);
    setCorrectionPreview(null);
    success({ kind: "updated", note: "The customer and any cleaners on upcoming visits have been told.", title: "Address corrected" });
    router.refresh();
  }

  function close() {
    setOpen(false);
    setValues(initial);
    setPreview(null);
    setMessage("");
    setNote("");
    setPriceOverride("");
    setCleanerAgreed(false);
    setAddingAddress(false);
    setCorrecting(false);
    setCorrectionPreview(null);
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

  const roomFields = [
    ["bedrooms", "Bedrooms"],
    ["bathrooms", "Bathrooms"],
    ["otherRooms", "Other rooms"],
  ] as const;

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <header className="flex items-start justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2 className="font-semibold">Edit booking</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {notesOnly
              ? "The cleaner is on the way or cleaning, so only the notes can change."
              : isOffice
                ? "Office visits are priced from their spaces, so length and extras stay as booked."
                : "Change what you need, then check the changes before saving."}
          </p>
        </div>
        <Button onClick={close} size="sm" variant="ghost">
          Close
        </Button>
      </header>

      <div className="divide-y">
        {!notesOnly ? (
          <Group title="When">
            <div className="grid gap-3 sm:grid-cols-2">
              <SimpleSelect
                aria-label="Date"
                className={selectClass}
                onChange={(value) => set("scheduledDate", value)}
                options={dateOptions(values.scheduledDate)}
                value={values.scheduledDate}
              />
              <SimpleSelect
                aria-label="Start time"
                className={selectClass}
                onChange={(value) => set("scheduledTime", value)}
                options={timeOptions(values.scheduledTime)}
                value={values.scheduledTime}
              />
            </div>
          </Group>
        ) : null}

        {!notesOnly ? (
          <Group title="Where">
            <SimpleSelect
              aria-label="Address"
              className={selectClass}
              onChange={(value) => set("addressId", value)}
              options={addressList.map((address) => ({ label: address.label, value: address.id }))}
              value={values.addressId}
            />
            {addingAddress ? (
              <div className="mt-3 rounded-lg bg-muted/40 p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    aria-label="House number or name"
                    onChange={(event) => setNewAddress((a) => ({ ...a, house: event.target.value }))}
                    placeholder="House number or name"
                    value={newAddress.house}
                  />
                  <Input
                    aria-label="Street"
                    onChange={(event) => setNewAddress((a) => ({ ...a, street: event.target.value }))}
                    placeholder="Street"
                    value={newAddress.street}
                  />
                  <Input
                    aria-label="Town or city"
                    onChange={(event) => setNewAddress((a) => ({ ...a, city: event.target.value }))}
                    placeholder="Town or city"
                    value={newAddress.city}
                  />
                  <Input
                    aria-label="Postcode"
                    onChange={(event) => setNewAddress((a) => ({ ...a, postcode: event.target.value }))}
                    placeholder="Postcode"
                    value={newAddress.postcode}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Saved to the customer&apos;s addresses, then selected for this booking.
                </p>
                {addressError ? <p className="mt-2 text-sm text-destructive">{addressError}</p> : null}
                <div className="mt-3 flex gap-2">
                  <Button disabled={addressBusy} onClick={() => void saveNewAddress()} size="sm">
                    {addressBusy ? "Saving…" : "Save address"}
                  </Button>
                  <Button
                    onClick={() => {
                      setAddingAddress(false);
                      setAddressError("");
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : correcting ? (
              <div className="mt-3 rounded-lg bg-muted/40 p-3">
                <p className="text-sm font-medium">Correct this address</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  For fixing a mistake, like a wrong house number. It changes the saved address for every
                  booking that uses it. If the customer has moved, add a new address instead.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <Input
                    aria-label="Address line 1"
                    className="sm:col-span-2"
                    onChange={(event) => updateCorrection("line1", event.target.value)}
                    placeholder="Address line 1"
                    value={correction.line1}
                  />
                  <Input
                    aria-label="Address line 2"
                    className="sm:col-span-2"
                    onChange={(event) => updateCorrection("line2", event.target.value)}
                    placeholder="Address line 2 (optional)"
                    value={correction.line2}
                  />
                  <Input
                    aria-label="Town or city"
                    onChange={(event) => updateCorrection("city", event.target.value)}
                    placeholder="Town or city"
                    value={correction.city}
                  />
                  <Input
                    aria-label="Postcode"
                    onChange={(event) => updateCorrection("postcode", event.target.value)}
                    placeholder="Postcode"
                    value={correction.postcode}
                  />
                  <Input
                    aria-label="Reason for the correction"
                    className="sm:col-span-2"
                    onChange={(event) => updateCorrection("note", event.target.value)}
                    placeholder="Reason for the correction (required)"
                    value={correction.note}
                  />
                </div>
                {correctionPreview ? (
                  <div className="mt-3 rounded-lg border bg-card p-3 text-sm">
                    {correctionPreview.changes.length ? (
                      <>
                        <dl className="divide-y">
                          {correctionPreview.changes.map((change) => (
                            <div className="grid grid-cols-[110px_1fr] gap-2 py-1.5" key={change.field}>
                              <dt className="text-muted-foreground">{change.field}</dt>
                              <dd>
                                <span className="text-muted-foreground line-through">{change.from}</span>{" "}
                                <span className="font-medium">{change.to}</span>
                              </dd>
                            </div>
                          ))}
                        </dl>
                        <p className="mt-2 text-amber-800">
                          {correctionPreview.totalBookings} booking
                          {correctionPreview.totalBookings === 1 ? " uses" : "s use"} this address
                          {correctionPreview.upcoming.length
                            ? `, ${correctionPreview.upcoming.length} upcoming:`
                            : ", none upcoming."}
                        </p>
                        {correctionPreview.upcoming.length ? (
                          <ul className="mt-1 space-y-0.5 text-muted-foreground">
                            {correctionPreview.upcoming.map((row) => (
                              <li key={row.id}>
                                {new Date(`${row.date}T12:00:00`).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  weekday: "short",
                                })}{" "}
                                {row.time}
                                {row.id === bookingId ? " (this booking)" : ""}
                                {row.hasCleaner ? " · cleaner is told" : ""}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </>
                    ) : (
                      <p>Nothing has changed yet.</p>
                    )}
                  </div>
                ) : null}
                {addressError ? <p className="mt-2 text-sm text-destructive">{addressError}</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    disabled={addressBusy || correction.note.trim().length < 3}
                    onClick={() => void checkCorrection()}
                    size="sm"
                    variant="outline"
                  >
                    Check correction
                  </Button>
                  <Button
                    disabled={addressBusy || !correctionPreview?.changes.length}
                    onClick={() => void saveCorrection()}
                    size="sm"
                  >
                    Correct address
                  </Button>
                  <Button
                    onClick={() => {
                      setCorrecting(false);
                      setCorrectionPreview(null);
                      setAddressError("");
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                <button
                  className="text-sm font-medium text-[#6a45b8] hover:underline"
                  onClick={startCorrection}
                  type="button"
                >
                  Edit this address
                </button>
                <button
                  className="text-sm font-medium text-[#6a45b8] hover:underline"
                  onClick={() => {
                    setCorrecting(false);
                    setAddingAddress(true);
                  }}
                  type="button"
                >
                  + Add a new address
                </button>
              </div>
            )}
          </Group>
        ) : null}

        {!notesOnly && !isOffice ? (
          <Group title="The clean">
            <div className="grid gap-3 sm:grid-cols-2">
              <SimpleSelect
                aria-label="Length"
                className={selectClass}
                onChange={(value) => set("durationHours", Number(value))}
                options={Array.from(new Set([...LENGTHS, values.durationHours]))
                  .sort((a, b) => a - b)
                  .map((hours) => ({ label: `${hours} hours on site`, value: String(hours) }))}
                value={String(values.durationHours)}
              />
              <SimpleSelect
                aria-label="Cleaning standard"
                className={selectClass}
                onChange={(value) => set("cleaningStandard", value)}
                options={[
                  { label: "Essential clean", value: "essential" },
                  { label: "Enhanced clean", value: "enhanced" },
                  { label: "Comprehensive clean", value: "comprehensive" },
                ]}
                value={values.cleaningStandard}
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {roomFields.map(([key, label]) => (
                <div className="rounded-lg border border-[#e8e8eb] px-3 py-2" key={key}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <StepButton
                      disabled={values[key] <= 0}
                      label={`Fewer ${label.toLowerCase()}`}
                      onClick={() => set(key, Math.max(0, values[key] - 1))}
                    >
                      −
                    </StepButton>
                    <span className="text-base font-semibold tabular-nums text-[#1c133b]">{values[key]}</span>
                    <StepButton
                      disabled={values[key] >= 20}
                      label={`More ${label.toLowerCase()}`}
                      onClick={() => set(key, Math.min(20, values[key] + 1))}
                    >
                      +
                    </StepButton>
                  </div>
                </div>
              ))}
            </div>
            {addOnOptions.length ? (
              <div className="mt-4">
                <p className={labelText}>Extras</p>
                <div className="mt-2 grid gap-x-4 gap-y-2.5 sm:grid-cols-2">
                  {addOnOptions.map((addOn) => (
                    <label className="flex cursor-pointer items-center gap-2.5 text-sm" key={addOn.id}>
                      <RoundCheckbox
                        checked={values.addOns.includes(addOn.id)}
                        onChange={() =>
                          set(
                            "addOns",
                            values.addOns.includes(addOn.id)
                              ? values.addOns.filter((id) => id !== addOn.id)
                              : [...values.addOns, addOn.id],
                          )
                        }
                      />
                      {addOn.label}
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
          </Group>
        ) : null}

        <Group title="Notes">
          <div className="grid gap-3 sm:grid-cols-2">
            <textarea
              aria-label="Customer notes"
              className={textArea}
              maxLength={2000}
              onChange={(event) => set("specialInstructions", event.target.value)}
              placeholder="Notes for the cleaner"
              value={values.specialInstructions}
            />
            <textarea
              aria-label="Access instructions"
              className={textArea}
              maxLength={1000}
              onChange={(event) => set("accessInstructions", event.target.value)}
              placeholder="Access: keys, door codes, parking"
              value={values.accessInstructions}
            />
          </div>
        </Group>
      </div>

      <footer className="space-y-3 border-t bg-muted/30 px-5 py-4">
        <Input
          aria-label="Reason for the change"
          onChange={(event) => {
            setNote(event.target.value);
            setPreview(null);
          }}
          placeholder="Reason for the change (required)"
          value={note}
        />
        {hasCleaner && !notesOnly ? (
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <RoundCheckbox
              checked={cleanerAgreed}
              onChange={(event) => {
                setCleanerAgreed(event.target.checked);
                setPreview(null);
              }}
            />
            <span>Already agreed a new time or address with the cleaner</span>
          </label>
        ) : null}
        {!notesOnly ? (
          showPrice ? (
            <div className="flex items-center gap-2">
              <Input
                aria-label="Set the price yourself"
                className="max-w-[180px]"
                inputMode="decimal"
                onChange={(event) => {
                  setPriceOverride(event.target.value);
                  setPreview(null);
                }}
                placeholder="Price, e.g. 65.00"
                value={priceOverride}
              />
              <span className="text-xs text-muted-foreground">Leave empty to use the recalculated price.</span>
            </div>
          ) : (
            <button
              className="text-sm font-medium text-[#6a45b8] hover:underline"
              onClick={() => setShowPrice(true)}
              type="button"
            >
              Set the price yourself
            </button>
          )
        ) : null}

        {preview ? (
          <div className="rounded-lg border bg-card p-3 text-sm">
            {preview.changes.length ? (
              <>
                <p className="font-semibold">What will change</p>
                <dl className="mt-2 divide-y">
                  {preview.changes.map((change) => (
                    <div className="grid grid-cols-[110px_1fr] gap-2 py-1.5" key={change.field}>
                      <dt className="text-muted-foreground">{change.field}</dt>
                      <dd>
                        <span className="text-muted-foreground line-through">{change.from}</span>{" "}
                        <span className="font-medium">{change.to}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
                {preview.cleanerMustReconfirm ? (
                  <p className="mt-2 text-amber-800">
                    The cleaner will be asked to accept the new details. Until they do, the booking shows as
                    matched, not confirmed.
                  </p>
                ) : null}
                {preview.holdNeedsReplacing ? (
                  <p className="mt-2 text-amber-800">
                    The card hold moves from {money(preview.oldTotalPence)} to {money(preview.newTotalPence)}. If
                    the bank refuses, nothing changes.
                  </p>
                ) : null}
              </>
            ) : (
              <p>Nothing has changed yet.</p>
            )}
          </div>
        ) : null}

        {message ? <ActionError message={message} title="Couldn’t edit this booking" /> : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
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
      </footer>
    </section>
  );
}

function Group({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="px-5 py-4">
      <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function StepButton({
  children,
  disabled,
  label,
  onClick,
}: {
  children: React.ReactNode;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#efe6ff] text-base font-semibold text-[#6a45b8] transition hover:bg-[#e3d6fb] disabled:opacity-40"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
