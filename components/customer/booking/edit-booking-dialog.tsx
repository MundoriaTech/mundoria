"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { pillPrimary, pillPrimaryStyle } from "@/components/customer/dashboard/section-banner";
import { AppModal } from "@/components/shared/app-modal";
import { useFeedback } from "@/components/shared/feedback-provider";
import { cn } from "@/lib/utils";

export type EditFocus = "requirements" | "duration" | "address";

type Values = {
  addOns: string[];
  addressId: string;
  bathrooms: number;
  bedrooms: number;
  cleaningStandard: string;
  durationHours: number;
  otherRooms: number;
  specialInstructions: string;
};

type FormData = {
  addOnOptions: Array<{ description: string; id: string; label: string }>;
  addresses: Array<{ id: string; label: string }>;
  closedMessage: string | null;
  hasCleaner: boolean;
  isOffice: boolean;
  open: boolean;
  values: Values;
};

type Preview = {
  changes: Array<{ field: string; from: string; to: string }>;
  cleanerMustReconfirm: boolean;
  holdNeedsReplacing: boolean;
  newTotalPence: number;
  oldTotalPence: number;
};

const TITLES: Record<EditFocus, string> = {
  address: "Update cleaning address",
  duration: "Change cleaning duration",
  requirements: "Edit cleaning requirements",
};

const STANDARDS = [
  { hint: "A tidy, regular-level clean", label: "Essential", value: "essential" },
  { hint: "Extra attention to detail", label: "Enhanced", value: "enhanced" },
  { hint: "Top to bottom, every corner", label: "Comprehensive", value: "comprehensive" },
];

const LENGTHS = Array.from({ length: 19 }, (_, i) => 2 + i * 0.5);

const tile = "rounded-[18px] bg-[#F3F4F6] p-4";
const tileLabel = "m-0 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#524096]/70";
const money = (pence: number) => `£${(pence / 100).toFixed(2)}`;

function Stepper({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  const button =
    "flex h-9 w-9 items-center justify-center rounded-full bg-white text-[18px] font-semibold text-[#524096] transition hover:bg-[#ECE8F6] disabled:opacity-40";
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-[14.5px] font-medium text-[#1E1848]">{label}</span>
      <span className="flex items-center gap-3">
        <button
          aria-label={`Fewer ${label.toLowerCase()}`}
          className={button}
          disabled={value <= 0}
          onClick={() => onChange(Math.max(0, value - 1))}
          type="button"
        >
          −
        </button>
        <span className="w-5 text-center text-[15px] font-semibold tabular-nums text-[#1E1848]">{value}</span>
        <button
          aria-label={`More ${label.toLowerCase()}`}
          className={button}
          disabled={value >= 20}
          onClick={() => onChange(Math.min(20, value + 1))}
          type="button"
        >
          +
        </button>
      </span>
    </div>
  );
}

/**
 * Lets the customer change rooms, standard, extras, notes, length or address
 * themselves. "Review changes" shows the new price before anything is saved.
 */
export function EditBookingDialog({
  bookingId,
  focus,
  onClose,
}: {
  bookingId: string;
  focus: EditFocus;
  onClose: () => void;
}) {
  const router = useRouter();
  const { success } = useFeedback();
  const [data, setData] = useState<FormData | null>(null);
  const [values, setValues] = useState<Values | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`/api/bookings/${bookingId}/edit`)
      .then(async (res) => {
        const json = (await res.json().catch(() => ({}))) as FormData & { error?: string };
        if (!live) return;
        if (!res.ok) {
          setError(json.error ?? "Couldn't load your booking. Try again.");
          return;
        }
        setData(json);
        setValues(json.values);
      })
      .catch(() => live && setError("Couldn't load your booking. Try again."));
    return () => {
      live = false;
    };
  }, [bookingId]);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => (current ? { ...current, [key]: value } : current));
    setPreview(null);
    setError(null);
  }

  function body(previewOnly: boolean) {
    if (!values) return {};
    const fields =
      focus === "address"
        ? { addressId: values.addressId }
        : focus === "duration"
          ? { durationHours: values.durationHours }
          : {
              addOns: values.addOns,
              bathrooms: values.bathrooms,
              bedrooms: values.bedrooms,
              cleaningStandard: values.cleaningStandard,
              otherRooms: values.otherRooms,
              specialInstructions: values.specialInstructions.trim() || null,
            };
    return { ...fields, preview: previewOnly };
  }

  async function send(previewOnly: boolean) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/edit`, {
        body: JSON.stringify(body(previewOnly)),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const json = (await res.json().catch(() => ({}))) as Preview & { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Couldn't save your changes. Try again.");
        return null;
      }
      return json;
    } finally {
      setBusy(false);
    }
  }

  async function review() {
    const result = await send(true);
    if (!result) return;
    if (!result.changes.length) {
      setError("You haven't changed anything yet.");
      return;
    }
    setPreview(result);
  }

  async function save() {
    const result = await send(false);
    if (!result) return;
    success({
      kind: "updated",
      note: result.cleanerMustReconfirm
        ? "We're checking the new details with your cleaner."
        : "We've emailed you a copy of the changes.",
      title: "Booking updated",
    });
    onClose();
    router.refresh();
  }

  const isOffice = data?.isOffice ?? false;
  const sizeLocked = isOffice && focus !== "address";

  return (
    <AppModal
      closeDisabled={busy}
      description={
        focus === "address"
          ? "Choose one of your saved addresses."
          : "Any price change is shown before you confirm."
      }
      dismissOnOverlay={false}
      onClose={onClose}
      title={TITLES[focus]}
    >
      <div className="mt-4 flex max-h-[60vh] flex-col gap-3 overflow-y-auto pr-1">
        {!data || !values ? (
          error ? (
            <p className="m-0 text-[14px] text-[#9A2B18]">{error}</p>
          ) : (
            <p className="m-0 text-[14px] text-[#6B6B70]">Loading your booking…</p>
          )
        ) : !data.open ? (
          <p className="m-0 rounded-[14px] bg-[#F3F4F6] p-4 text-[14px] leading-[1.5] text-[#3d3a48]">
            {data.closedMessage}
          </p>
        ) : sizeLocked ? (
          <p className="m-0 rounded-[14px] bg-[#F3F4F6] p-4 text-[14px] leading-[1.5] text-[#3d3a48]">
            Office cleans are priced from your spaces, so message us to change what&apos;s included or how
            long it takes.
          </p>
        ) : preview ? (
          <div className={tile}>
            <p className={tileLabel}>Your changes</p>
            <dl className="m-0 mt-2">
              {preview.changes.map((change) => (
                <div className="border-b border-[#E4E3EA] py-2.5 last:border-0" key={change.field}>
                  <dt className="text-[12.5px] text-[#6B6B70]">{change.field}</dt>
                  <dd className="m-0 mt-0.5 text-[14.5px] text-[#1E1848]">
                    <span className="text-[#6B6B70] line-through decoration-[#C9C6D6]">{change.from}</span>{" "}
                    → <span className="font-semibold">{change.to}</span>
                  </dd>
                </div>
              ))}
            </dl>
            {preview.newTotalPence !== preview.oldTotalPence ? (
              <p className="m-0 mt-3 text-[13.5px] leading-[1.5] text-[#3d3a48]">
                {preview.holdNeedsReplacing
                  ? `The hold on your card changes from ${money(preview.oldTotalPence)} to ${money(preview.newTotalPence)}. If your bank doesn't accept it, nothing changes.`
                  : `Your new total is ${money(preview.newTotalPence)}. You're only charged after the clean.`}
              </p>
            ) : null}
            {preview.cleanerMustReconfirm ? (
              <p className="m-0 mt-2 text-[13.5px] leading-[1.5] text-[#3d3a48]">
                Your cleaner will be asked to confirm the new address. If they can&apos;t make it, we&apos;ll find
                another cleaner and let you know.
              </p>
            ) : null}
          </div>
        ) : focus === "address" ? (
          <div className="flex flex-col gap-2" role="radiogroup">
            {data.addresses.map((address) => (
              <button
                aria-checked={values.addressId === address.id}
                className={cn(
                  "flex min-h-[56px] items-center gap-3 rounded-[14px] px-4 text-left text-[14.5px] font-medium text-[#1E1848] transition",
                  values.addressId === address.id ? "bg-[#ECE8F6] ring-2 ring-[#524096]" : "bg-[#F3F4F6] hover:bg-[#ECE8F6]",
                )}
                key={address.id}
                onClick={() => set("addressId", address.id)}
                role="radio"
                type="button"
              >
                <span
                  className={cn(
                    "h-4 w-4 shrink-0 rounded-full border-2",
                    values.addressId === address.id ? "border-[#524096] bg-[#524096]" : "border-[#B9B4CC] bg-white",
                  )}
                />
                {address.label}
              </button>
            ))}
            <Link
              className="mt-1 px-1 text-[13.5px] font-semibold text-[#524096] underline-offset-2 hover:underline"
              href="/addresses"
            >
              Add a new address
            </Link>
          </div>
        ) : focus === "duration" ? (
          <div className={tile}>
            <p className={tileLabel}>Time on site</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {Array.from(new Set([...LENGTHS, values.durationHours]))
                .sort((a, b) => a - b)
                .map((hours) => (
                  <button
                    aria-pressed={values.durationHours === hours}
                    className={cn(
                      "min-h-10 rounded-full px-4 text-[14px] font-semibold transition",
                      values.durationHours === hours
                        ? "bg-[#524096] text-white"
                        : "bg-white text-[#524096] hover:bg-[#ECE8F6]",
                    )}
                    key={hours}
                    onClick={() => set("durationHours", hours)}
                    type="button"
                  >
                    {hours} h
                  </button>
                ))}
            </div>
          </div>
        ) : (
          <>
            <div className={tile}>
              <p className={tileLabel}>Rooms</p>
              <div className="mt-2">
                <Stepper label="Bedrooms" onChange={(v) => set("bedrooms", v)} value={values.bedrooms} />
                <Stepper label="Bathrooms" onChange={(v) => set("bathrooms", v)} value={values.bathrooms} />
                <Stepper label="Other rooms" onChange={(v) => set("otherRooms", v)} value={values.otherRooms} />
              </div>
              <p className="m-0 mt-2 text-[12.5px] leading-[1.4] text-[#6B6B70]">
                Rooms help your cleaner plan. To change how long the visit lasts, use Change cleaning duration.
              </p>
            </div>
            <div className={tile}>
              <p className={tileLabel}>Cleaning standard</p>
              <div className="mt-3 grid gap-2">
                {STANDARDS.map((standard) => (
                  <button
                    aria-pressed={values.cleaningStandard === standard.value}
                    className={cn(
                      "rounded-[14px] px-4 py-3 text-left transition",
                      values.cleaningStandard === standard.value
                        ? "bg-white ring-2 ring-[#524096]"
                        : "bg-white/60 hover:bg-white",
                    )}
                    key={standard.value}
                    onClick={() => set("cleaningStandard", standard.value)}
                    type="button"
                  >
                    <span className="block text-[14.5px] font-semibold text-[#1E1848]">{standard.label}</span>
                    <span className="block text-[12.5px] text-[#6B6B70]">{standard.hint}</span>
                  </button>
                ))}
              </div>
            </div>
            {data.addOnOptions.length ? (
              <div className={tile}>
                <p className={tileLabel}>Extras</p>
                <div className="mt-2 flex flex-col">
                  {data.addOnOptions.map((addOn) => (
                    <label
                      className="flex cursor-pointer items-start gap-3 border-b border-[#E4E3EA] py-2.5 last:border-0"
                      key={addOn.id}
                    >
                      <input
                        checked={values.addOns.includes(addOn.id)}
                        className="mt-1 h-4 w-4 accent-[#524096]"
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
                      <span className="min-w-0">
                        <span className="block text-[14.5px] font-medium text-[#1E1848]">{addOn.label}</span>
                        <span className="block text-[12.5px] leading-[1.4] text-[#6B6B70]">{addOn.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
            <div className={tile}>
              <label className={tileLabel} htmlFor={`notes-${bookingId}`}>
                Notes for your cleaner
              </label>
              <textarea
                className="mt-2 min-h-[88px] w-full rounded-[12px] border-[1.5px] border-[#E1E1EA] bg-white p-3 text-[16px] text-[#1E1848] outline-none focus:border-[#524096]"
                id={`notes-${bookingId}`}
                maxLength={2000}
                onChange={(event) => set("specialInstructions", event.target.value)}
                placeholder="e.g. Please focus on the kitchen. The cat may hide under the bed."
                value={values.specialInstructions}
              />
            </div>
          </>
        )}
        {data && error ? <p className="m-0 text-[13.5px] text-[#9A2B18]">{error}</p> : null}
      </div>

      {data?.open && !sizeLocked ? (
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="inline-flex min-h-12 items-center justify-center rounded-full px-5 text-[15px] font-semibold text-[#524096] transition hover:bg-[#ECE8F6] disabled:opacity-60"
            disabled={busy}
            onClick={preview ? () => setPreview(null) : onClose}
            type="button"
          >
            {preview ? "Back" : "Cancel"}
          </button>
          <button
            className={cn(pillPrimary, "disabled:opacity-60")}
            disabled={busy || !values}
            onClick={() => void (preview ? save() : review())}
            style={pillPrimaryStyle}
            type="button"
          >
            {busy ? "Just a moment…" : preview ? "Confirm changes" : "Review changes"}
          </button>
        </div>
      ) : null}
    </AppModal>
  );
}
