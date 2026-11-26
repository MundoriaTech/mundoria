"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  CALLBACK_AREA_LABELS,
  CALLBACK_AREAS,
  CALLBACK_CALL_LABELS,
  CALLBACK_CALL_STATUSES,
  CALLBACK_OUTCOME_LABELS,
  CALLBACK_OUTCOMES,
  type CallbackArea,
  type CallbackCallStatus,
  type CallbackLeadRow,
  type CallbackOutcome,
} from "@/lib/admin/callback-desk";

const fieldClass =
  "h-11 w-full rounded-xl border border-[#E1E1EA] bg-white px-3 text-[15px] text-[#1c133b] outline-none focus:border-[#524096]";

function DeskSelect({
  disabled,
  label,
  onChange,
  options,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  value: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = options.find((option) => option.value === value)?.label ?? "—";

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[12.3px] font-semibold uppercase tracking-[0.1em] text-[#5F5F66]">
        {label}
      </span>
      <div className="relative" ref={rootRef}>
        <button
          aria-expanded={open}
          aria-haspopup="listbox"
          className="inline-flex h-11 w-full items-center justify-between gap-2 rounded-full border border-[#E1E1EA] bg-[#F7F6FB] px-4 text-left text-[15px] font-semibold text-[#1c133b] disabled:opacity-50"
          disabled={disabled}
          onClick={() => setOpen((currentOpen) => !currentOpen)}
          type="button"
        >
          <span className="truncate">{current}</span>
          <ChevronDown
            aria-hidden
            className={`h-4 w-4 shrink-0 text-[#524096] transition-transform ${open ? "rotate-180" : ""}`}
            strokeWidth={2}
          />
        </button>
        {open ? (
          <div
            className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-[#E1E1EA] bg-white py-1 shadow-lg"
            role="listbox"
          >
            {options.map((option) => {
              const selected = option.value === value;
              return (
                <button
                  className="block w-full truncate px-4 py-2.5 text-left text-[15px] text-[#1c133b] hover:bg-[#F3F4F6]"
                  key={option.value || "empty"}
                  onClick={() => {
                    setOpen(false);
                    if (option.value !== value) onChange(option.value);
                  }}
                  aria-selected={selected}
                  role="option"
                  style={{
                    background: selected ? "#F3EEF8" : undefined,
                    fontWeight: selected ? 600 : 500,
                  }}
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </label>
  );
}

export function CallbackLeadDesk({ row }: { row: CallbackLeadRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [notes, setNotes] = useState(row.notes ?? "");
  const [town, setTown] = useState(row.town ?? "");
  const [storedNotes, setStoredNotes] = useState(row.notes ?? "");
  const [storedTown, setStoredTown] = useState(row.town ?? "");
  const textDirty = storedTown !== town || storedNotes !== notes;

  async function save(patch: Record<string, unknown>, textFields = false) {
    setBusy(true);
    setError(null);
    if (textFields) setSaved(false);
    try {
      const response = await fetch(`/api/admin/callback-leads/${row.id}`, {
        body: JSON.stringify(patch),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        setError(result.error ?? "Could not save.");
        return;
      }
      if (textFields) {
        setStoredTown(town);
        setStoredNotes(notes);
        setSaved(true);
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function saveTextFields() {
    void save({ notes, town }, true);
  }

  const when = new Date(row.created_at).toLocaleString("en-GB", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
  const utm = [row.utm_source, row.utm_medium, row.utm_campaign]
    .filter(Boolean)
    .join(" / ");

  return (
    <div className="rounded-[18px] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-[22px] font-semibold text-[#1c133b]">
            {row.first_name} {row.last_name}
          </h2>
          <p className="mt-1 mb-0 text-[14.5px] text-[#5F5F66]">
            {row.source}
            {utm ? ` · ${utm}` : ""}
            {row.available_in_10_min ? " · asked for a call in 10 min" : ""}
            {` · ${when}`}
          </p>
        </div>
        <a
          className="inline-flex h-11 items-center rounded-full bg-[#524096] px-5 text-[15px] font-semibold text-white"
          href={`tel:${row.phone}`}
        >
          Call {row.phone}
        </a>
      </div>

      <p className="mt-2 mb-6 break-all text-[14.5px] text-[#5F5F66]">{row.email}</p>

      <div className="grid gap-4 sm:grid-cols-3">
        <DeskSelect
          disabled={busy}
          label="Call"
          onChange={(value) => void save({ callStatus: value as CallbackCallStatus })}
          options={CALLBACK_CALL_STATUSES.map((status) => ({
            label: CALLBACK_CALL_LABELS[status],
            value: status,
          }))}
          value={row.call_status}
        />
        <DeskSelect
          disabled={busy}
          label="Outcome"
          onChange={(value) =>
            void save({ outcome: value ? (value as CallbackOutcome) : null })
          }
          options={[
            { label: "—", value: "" },
            ...CALLBACK_OUTCOMES.map((outcome) => ({
              label: CALLBACK_OUTCOME_LABELS[outcome],
              value: outcome,
            })),
          ]}
          value={row.outcome ?? ""}
        />
        <DeskSelect
          disabled={busy}
          label="Area"
          onChange={(value) => void save({ area: value as CallbackArea })}
          options={CALLBACK_AREAS.map((area) => ({
            label: CALLBACK_AREA_LABELS[area],
            value: area,
          }))}
          value={row.area}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[12.3px] font-semibold uppercase tracking-[0.1em] text-[#5F5F66]">
            Town
          </span>
          <input
            className={fieldClass}
            disabled={busy}
            onChange={(event) => {
              setSaved(false);
              setTown(event.target.value);
            }}
            placeholder="Lincoln, Bromsgrove…"
            value={town}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-[12.3px] font-semibold uppercase tracking-[0.1em] text-[#5F5F66]">
            Notes
          </span>
          <textarea
            className="min-h-[88px] w-full rounded-xl border border-[#E1E1EA] bg-white px-3 py-2.5 text-[15px] text-[#1c133b] outline-none focus:border-[#524096]"
            disabled={busy}
            onChange={(event) => {
              setSaved(false);
              setNotes(event.target.value);
            }}
            placeholder="What they said on the call"
            value={notes}
          />
          {row.notes_updated_at ? (
            <span className="mt-1.5 block text-[13px] text-[#5F5F66]">
              Last saved by {row.notes_updated_by_name ?? "an admin"} ·{" "}
              {new Date(row.notes_updated_at).toLocaleString("en-GB", {
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                month: "short",
                timeZone: "Europe/London",
                year: "numeric",
              })}
            </span>
          ) : null}
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          className="inline-flex h-11 items-center rounded-full bg-[#1c133b] px-5 text-[15px] font-semibold text-white disabled:opacity-50"
          disabled={busy || !textDirty}
          onClick={saveTextFields}
          type="button"
        >
          {busy && textDirty ? "Saving…" : "Save"}
        </button>
        {saved && !textDirty ? (
          <p className="m-0 text-[14px] font-medium text-[#1c133b]">Saved</p>
        ) : null}
      </div>

      {error ? (
        <p className="mt-3 mb-0 text-[14px] font-medium text-[#C0272D]">{error}</p>
      ) : null}
    </div>
  );
}
