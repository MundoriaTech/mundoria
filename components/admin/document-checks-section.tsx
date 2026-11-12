"use client";

import { useState, type ReactNode } from "react";

import { DocumentReviewControls } from "@/components/admin/document-review-controls";
import type { CleanerDocumentKind } from "@/lib/cleaner/document-reviews";

type DocFile = {
  label: string;
  path: string | null;
  url: string | null;
};

type CheckItem = {
  detail: string;
  documents: DocFile[];
  kind: CleanerDocumentKind;
  note?: string | null;
  status: string;
};

export function DocumentChecksSection({
  cleanerId,
  items,
  meta,
}: {
  cleanerId: string;
  items: CheckItem[];
  meta: Array<{ label: string; value: ReactNode }>;
}) {
  const firstPending = items.find(
    (item) =>
      item.status === "pending" && item.documents.some((doc) => Boolean(doc.url)),
  )?.kind;
  const [openKind, setOpenKind] = useState<CleanerDocumentKind | null>(
    firstPending ?? null,
  );

  return (
    <section className="rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-semibold">Checks & documents</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Open a file, then Review to approve or reject with a note.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {items.filter((item) => item.status === "verified").length}/
          {items.filter((item) => item.documents.some((doc) => Boolean(doc.url)))
            .length || items.length}{" "}
          uploaded approved
        </p>
      </div>

      <div className="mt-3 divide-y divide-border">
        {items.map((item) => (
          <DocumentReviewControls
            cleanerId={cleanerId}
            detail={item.detail}
            documents={item.documents}
            key={item.kind}
            kind={item.kind}
            note={item.note}
            onToggle={() =>
              setOpenKind((current) =>
                current === item.kind ? null : item.kind,
              )
            }
            open={openKind === item.kind}
            status={item.status}
          />
        ))}
      </div>

      <dl className="mt-4 grid gap-3 border-t pt-4 text-sm sm:grid-cols-2">
        {meta.map((row) => (
          <div key={row.label}>
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
