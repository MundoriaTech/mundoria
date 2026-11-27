"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { SectionBanner } from "@/components/customer/dashboard/section-banner";
import { ContactSupportButton } from "@/components/shared/contact-support-button";
import { cn } from "@/lib/utils";

type Row = {
  danger?: boolean;
  hint: string;
  key: string;
  label: string;
  /** Opens a dialog or panel; omitted when the action isn't available. */
  onClick?: () => void;
  /** Handled by the support team through chat. */
  viaSupport?: boolean;
};

const rowClass =
  "flex min-h-[60px] w-full items-center gap-3 rounded-[14px] bg-[#F3F4F6] px-4 py-2.5 text-left transition hover:bg-[#ECE8F6] disabled:cursor-not-allowed disabled:opacity-60";

function RowBody({ danger, hint, label }: Pick<Row, "danger" | "hint" | "label">) {
  return (
    <span className="min-w-0 flex-1">
      <span className={cn("block text-[15px] font-semibold", danger ? "text-[#9f1239]" : "text-[#1E1848]")}>
        {label}
      </span>
      <span className="block text-[12.5px] leading-[1.4] text-[#6B6B70]">{hint}</span>
    </span>
  );
}

/**
 * Manage booking, collapsible. Each row either runs a self-serve action or,
 * where a change affects the price, the cleaner or matching, opens a chat with
 * the support team who make it safely.
 */
export function ManageBooking({
  accessInstructions,
  bookingId,
  canEditAccess,
  rows,
}: {
  accessInstructions: string | null;
  bookingId: string;
  canEditAccess: boolean;
  rows: Row[];
}) {
  const [open, setOpen] = useState(false);
  const [editingAccess, setEditingAccess] = useState(false);
  const [access, setAccess] = useState(accessInstructions ?? "");
  const [saved, setSaved] = useState(accessInstructions ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveAccess() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/bookings/${bookingId}/access-instructions`, {
      body: JSON.stringify({ instructions: access }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string; instructions?: string | null };
    setSaving(false);
    if (!res.ok) {
      setError(json.error ?? "Couldn't save. Try again.");
      return;
    }
    setSaved(json.instructions ?? "");
    setAccess(json.instructions ?? "");
    setEditingAccess(false);
  }

  return (
    <section className="flex flex-col gap-4 rounded-[22px] bg-white p-4 sm:p-5">
      <SectionBanner title="Manage booking">
        <button
          aria-controls={`manage-${bookingId}`}
          aria-expanded={open}
          aria-label={open ? "Hide booking options" : "Show booking options"}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          <ChevronDown aria-hidden className={cn("h-5 w-5 transition", open && "rotate-180")} />
        </button>
      </SectionBanner>
      {!open ? (
        <button
          className="m-0 px-1 text-left text-[13.5px] text-[#5F5F66] underline-offset-2 hover:text-[#524096] hover:underline"
          onClick={() => setOpen(true)}
          type="button"
        >
          Change, update or cancel this visit.
        </button>
      ) : null}

      {open ? (
        <div className="flex flex-col gap-2.5" id={`manage-${bookingId}`}>
          {rows.map((row) =>
            row.key === "access" ? (
              <div className="rounded-[14px] bg-[#F3F4F6]" key={row.key}>
                <button
                  className={rowClass}
                  disabled={!canEditAccess}
                  onClick={() => setEditingAccess((value) => !value)}
                  type="button"
                >
                  <RowBody
                    hint={saved ? `Saved: ${saved.length > 60 ? `${saved.slice(0, 60)}…` : saved}` : row.hint}
                    label={saved ? "Edit access instructions" : row.label}
                  />
                </button>
                {editingAccess ? (
                  <div className="px-4 pb-4">
                    <label className="sr-only" htmlFor={`access-${bookingId}`}>Access instructions</label>
                    <textarea
                      className="min-h-[96px] w-full rounded-[12px] border-[1.5px] border-[#E1E1EA] bg-white p-3 text-[16px] text-[#1E1848] outline-none focus:border-[#524096]"
                      id={`access-${bookingId}`}
                      maxLength={1000}
                      onChange={(event) => setAccess(event.target.value)}
                      placeholder="e.g. Key safe by the back door, code 1234. Park in bay 6."
                      value={access}
                    />
                    <p className="m-0 mt-1 text-[12px] text-[#6B6B70]">
                      Only your cleaner sees this. They&apos;re notified when you change it.
                    </p>
                    {error ? <p className="m-0 mt-2 text-[13px] text-[#C0272D]">{error}</p> : null}
                    <div className="mt-3 flex gap-2">
                      <button
                        className="inline-flex min-h-11 items-center rounded-full bg-[#524096] px-5 text-[14px] font-semibold text-white disabled:opacity-60"
                        disabled={saving || access.trim() === saved.trim()}
                        onClick={() => void saveAccess()}
                        type="button"
                      >
                        {saving ? "Saving…" : "Save"}
                      </button>
                      <button
                        className="inline-flex min-h-11 items-center rounded-full px-4 text-[14px] font-semibold text-[#524096]"
                        onClick={() => {
                          setAccess(saved);
                          setEditingAccess(false);
                          setError(null);
                        }}
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : row.viaSupport ? (
              <ContactSupportButton className={rowClass} key={row.key} label={<RowBody hint={row.hint} label={row.label} />} />
            ) : (
              <button className={rowClass} disabled={!row.onClick} key={row.key} onClick={row.onClick} type="button">
                <RowBody danger={row.danger} hint={row.hint} label={row.label} />
              </button>
            ),
          )}
        </div>
      ) : null}
    </section>
  );
}
