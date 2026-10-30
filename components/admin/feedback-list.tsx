"use client";

import { PagedList } from "@/components/shared/paged-list";
import {
  formatGuestFeedbackDate,
  guestFeedbackMoodLabel,
} from "@/lib/guest-feedback";
import { PAGE_SIZES } from "@/lib/pagination";

export type GuestFeedbackRow = {
  client_name: string;
  comment: string | null;
  created_at: string;
  id: string;
  invoice_number: string | null;
  mood: string | null;
  service_date: string | null;
  service_label: string | null;
};

export function FeedbackList({ rows }: { rows: GuestFeedbackRow[] }) {
  return (
    <PagedList
      empty={<p className="text-sm text-[#5a5470]">No feedback yet.</p>}
      items={rows}
      listClassName="grid gap-4"
      pageSize={PAGE_SIZES.admin}
      renderItem={(row) => (
        <article
          className="rounded-2xl border border-[#e6e0f2] bg-white p-5"
          key={row.id}
        >
          <p className="text-sm font-semibold text-[#312c79]">
            {[
              row.client_name.trim(),
              row.mood ? guestFeedbackMoodLabel(row.mood) : "",
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {row.service_label || row.service_date || row.invoice_number ? (
            <p className="mt-1 text-sm text-[#5a5470]">
              {[
                row.service_label,
                row.service_date
                  ? `on ${formatGuestFeedbackDate(row.service_date)}`
                  : null,
                row.invoice_number,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
          {row.comment ? (
            <p className="mt-3 text-sm leading-6 text-[#1c133b]">{row.comment}</p>
          ) : (
            <p className="mt-3 text-sm text-[#5a5470]">No written comment.</p>
          )}
        </article>
      )}
    />
  );
}
