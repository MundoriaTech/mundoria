"use client";

import { PagedTable } from "@/components/shared/paged-list";
import { PAGE_SIZES } from "@/lib/pagination";

export type CallbackLeadRow = {
  available_in_10_min: boolean;
  created_at: string;
  email: string;
  first_name: string;
  id: string;
  last_name: string;
  phone: string;
  source: string;
  utm_campaign: string | null;
  utm_medium: string | null;
  utm_source: string | null;
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function CallbackLeadsTable({ rows }: { rows: CallbackLeadRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <PagedTable
        empty="No callback leads yet."
        headers={[
          "Name",
          "Phone",
          "Email",
          "Call in 10 min",
          "Source",
          "Submitted",
        ]}
        items={rows}
        minWidthClassName="min-w-[920px]"
        pageSize={PAGE_SIZES.admin}
        renderRow={(row) => (
          <tr className="border-b last:border-0" key={row.id}>
            <td className="px-4 py-3">
              <p className="font-medium">
                {row.first_name} {row.last_name}
              </p>
              {(row.utm_source || row.utm_medium || row.utm_campaign) && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {[row.utm_source, row.utm_medium, row.utm_campaign]
                    .filter(Boolean)
                    .join(" / ")}
                </p>
              )}
            </td>
            <td className="whitespace-nowrap px-4 py-3">{row.phone}</td>
            <td className="break-all px-4 py-3">{row.email}</td>
            <td className="whitespace-nowrap px-4 py-3">
              {row.available_in_10_min ? "Yes" : "No"}
            </td>
            <td className="px-4 py-3">{row.source}</td>
            <td className="whitespace-nowrap px-4 py-3">
              {formatWhen(row.created_at)}
            </td>
          </tr>
        )}
      />
    </div>
  );
}
