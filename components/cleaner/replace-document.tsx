"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ActionError } from "@/components/shared/action-error";
import { DatePickerField } from "@/components/shared/date-picker-field";
import { useFeedback } from "@/components/shared/feedback-provider";
import { SimpleSelect } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CleanerDocumentKind } from "@/lib/cleaner/document-reviews";
import { sanitiseCleanerUploadFileName } from "@/lib/cleaner/document-urls";
import {
  formatShareCode,
  normaliseShareCode,
  RIGHT_TO_WORK_SHARE_CODE_URL,
  type RightToWorkRoute,
  VISA_TYPES,
} from "@/lib/cleaner/right-to-work";
import { createBrowserClient } from "@/lib/supabase/client";

const MULTI_PAGE: CleanerDocumentKind[] = ["id", "dbs"];

/**
 * Lets a cleaner replace a rejected, missing, pending or expired document
 * from their profile (or add right-to-work details). Only that item goes
 * back for review.
 */
export function ReplaceDocument({
  initial,
  kind,
  userId,
}: {
  initial?: {
    date_of_birth?: string | null;
    right_to_work_expires_on?: string | null;
    right_to_work_route?: RightToWorkRoute | null;
    right_to_work_share_code?: string | null;
    right_to_work_visa_type?: string | null;
  };
  kind: CleanerDocumentKind;
  userId: string;
}) {
  const router = useRouter();
  const { success } = useFeedback();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [expiry, setExpiry] = useState("");
  const [route, setRoute] = useState<RightToWorkRoute | "">(initial?.right_to_work_route ?? "");
  const [dob, setDob] = useState(initial?.date_of_birth ?? "");
  const [shareCode, setShareCode] = useState(initial?.right_to_work_share_code ?? "");
  const [rtwExpiry, setRtwExpiry] = useState(initial?.right_to_work_expires_on ?? "");
  const [visaType, setVisaType] = useState(initial?.right_to_work_visa_type ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      let body: Record<string, unknown>;
      if (kind === "right_to_work") {
        body = {
          date_of_birth: dob,
          kind,
          right_to_work_expires_on: rtwExpiry,
          right_to_work_route: route,
          right_to_work_share_code: shareCode,
          right_to_work_visa_type: visaType,
        };
      } else {
        if (!files.length) {
          setError("Choose a file to upload.");
          return;
        }
        if (kind === "insurance" && !expiry) {
          setError("Enter the date your insurance expires.");
          return;
        }
        const supabase = createBrowserClient();
        const paths: string[] = [];
        for (let index = 0; index < files.length; index += 1) {
          const file = files[index];
          const safeName = sanitiseCleanerUploadFileName(file.name);
          const path = `${userId}/${kind}-replacement-${Date.now()}-${index + 1}-${safeName}`;
          const { error: uploadError } = await supabase.storage
            .from("cleaner-documents")
            .upload(path, file, { upsert: false });
          if (uploadError) {
            setError(uploadError.message || "Upload failed. Try again.");
            return;
          }
          paths.push(path);
        }
        body = { kind, paths, ...(kind === "insurance" ? { expiry_date: expiry } : {}) };
      }
      const response = await fetch("/api/cleaner/documents", {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "Couldn’t send that. Try again.");
        return;
      }
      success({
        kind: "done",
        note: "Mundoria will review it and let you know.",
        title: "Sent for review",
      });
      setOpen(false);
      setFiles([]);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button
        className="mt-2 h-9 rounded-full px-4 text-sm"
        onClick={() => setOpen(true)}
        type="button"
        variant="outline"
      >
        {kind === "right_to_work" ? "Add right to work details" : "Upload a new one"}
      </Button>
    );
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-[#ebe4da] bg-white p-3">
      {kind === "right_to_work" ? (
        <>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[#1c133b]">How can you prove it?</span>
            <SimpleSelect
              className="h-11 rounded-xl"
              onChange={(value) => setRoute(value as RightToWorkRoute | "")}
              options={[
                { label: "British or Irish citizen (passport, or birth certificate + NI number)", value: "british_irish" },
                { label: "Share code (visa, eVisa or EU Settlement)", value: "share_code" },
              ]}
              placeholder="Choose…"
              value={route}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[#1c133b]">Date of birth</span>
            <DatePickerField
              max={new Date().toISOString().slice(0, 10)}
              min="1920-01-01"
              onChange={setDob}
              value={dob}
            />
          </label>
          {route === "share_code" ? (
            <>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-[#1c133b]">Visa or immigration status</span>
                <SimpleSelect
                  className="h-11 rounded-xl"
                  onChange={setVisaType}
                  options={VISA_TYPES.map((type) => ({ label: type.label, value: type.value }))}
                  placeholder="Choose…"
                  value={visaType}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-[#1c133b]">Share code</span>
                <Input
                  maxLength={11}
                  onChange={(event) => setShareCode(normaliseShareCode(event.target.value))}
                  placeholder="W12 345 678"
                  value={formatShareCode(shareCode)}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-[#1c133b]">
                  Permission ends (leave empty if not time-limited)
                </span>
                <DatePickerField
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={setRtwExpiry}
                  value={rtwExpiry}
                />
              </label>
              <a
                className="text-sm font-semibold text-[#312c79] underline"
                href={RIGHT_TO_WORK_SHARE_CODE_URL}
                rel="noreferrer"
                target="_blank"
              >
                Get a share code on GOV.UK
              </a>
            </>
          ) : null}
        </>
      ) : (
        <>
          <Input
            accept="image/*,application/pdf"
            multiple={MULTI_PAGE.includes(kind)}
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            type="file"
          />
          {MULTI_PAGE.includes(kind) ? (
            <p className="text-xs text-[#5c5670]">
              You can choose several files, for example the front and back.
            </p>
          ) : null}
          {kind === "insurance" ? (
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-[#1c133b]">Insurance expiry date</span>
              <DatePickerField
                min={new Date().toISOString().slice(0, 10)}
                onChange={setExpiry}
                value={expiry}
              />
            </label>
          ) : null}
        </>
      )}
      {error ? <ActionError message={error} title="Couldn’t send this" /> : null}
      <div className="flex flex-wrap gap-2">
        <Button className="h-10 rounded-full px-4" disabled={busy} onClick={() => void submit()} type="button">
          {busy ? "Sending…" : "Send for review"}
        </Button>
        <Button
          className="h-10 rounded-full px-4"
          disabled={busy}
          onClick={() => setOpen(false)}
          type="button"
          variant="ghost"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
