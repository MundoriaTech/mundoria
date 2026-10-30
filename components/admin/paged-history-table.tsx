"use client";

import { PagedTable } from "@/components/shared/paged-list";
import { PAGE_SIZES } from "@/lib/pagination";

export function PagedHistoryTable({
  empty = "Nothing here yet.",
  headers,
  rows,
  title,
}: {
  empty?: string;
  headers: string[];
  rows: (string | number | null)[][];
  title: string;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card p-4 sm:p-5">
      <h2 className="mb-4 font-semibold">{title}</h2>
      <PagedTable
        empty={empty}
        headers={headers}
        items={rows}
        minWidthClassName="min-w-[520px]"
        pageSize={PAGE_SIZES.admin}
        renderRow={(row, index) => (
          <tr key={index}>
            {row.map((cell, cellIndex) => (
              <td
                className="border-b p-2 first:pl-4 sm:first:pl-2"
                key={cellIndex}
              >
                {cell}
              </td>
            ))}
          </tr>
        )}
      />
    </section>
  );
}
