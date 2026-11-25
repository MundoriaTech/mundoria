"use client";

import {
  ClientPagination,
  usePagedItems,
} from "@/components/shared/pagination-controls";
import { PAGE_SIZES } from "@/lib/pagination";

/** Small admin table of text rows, paged 25 at a time. */
export function PagedSimpleTable({ rows, title }: { rows: string[][]; title: string }) {
  const { page, pageItems, setPage, totalItems } = usePagedItems(rows, PAGE_SIZES.admin);
  return (
    <section className="overflow-hidden rounded-xl border bg-card p-4 sm:p-5">
      <h2 className="mb-3 font-semibold">{title}</h2>
      <div className="-mx-4 overflow-x-auto sm:mx-0">
        <table className="w-full min-w-[480px] text-sm">
          <tbody>
            {pageItems.map((row, i) => (
              <tr className="border-b" key={`${page}-${i}`}>
                {row.map((cell, j) => (
                  <td className="break-words p-2 first:pl-4 sm:first:pl-2" key={j}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length ? <p className="text-sm text-muted-foreground">No records.</p> : null}
      <ClientPagination
        className="mt-3"
        onPageChange={setPage}
        page={page}
        pageSize={PAGE_SIZES.admin}
        totalItems={totalItems}
      />
    </section>
  );
}
