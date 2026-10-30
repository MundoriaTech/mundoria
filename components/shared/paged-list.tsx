"use client";

import {
  ClientPagination,
  usePagedItems,
} from "@/components/shared/pagination-controls";
import { PAGE_SIZES } from "@/lib/pagination";
import { cn } from "@/lib/utils";

/** Client-side paging for in-memory card/list UIs. */
export function PagedList<T>({
  className,
  empty,
  items,
  listClassName,
  pageSize = PAGE_SIZES.admin,
  renderItem,
  resetKey,
}: {
  className?: string;
  empty?: React.ReactNode;
  items: T[];
  listClassName?: string;
  pageSize?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  resetKey?: string | number | boolean;
}) {
  const { page, pageItems, setPage, totalItems } = usePagedItems(
    items,
    pageSize,
    resetKey,
  );

  if (!items.length) {
    return empty ? <>{empty}</> : null;
  }

  return (
    <div className={cn("min-w-0", className)}>
      <div className={listClassName}>
        {pageItems.map((item, index) => renderItem(item, index))}
      </div>
      <ClientPagination
        className="mt-4"
        onPageChange={setPage}
        page={page}
        pageSize={pageSize}
        totalItems={totalItems}
      />
    </div>
  );
}

/** Client-side paging for simple HTML tables. */
export function PagedTable<T>({
  className,
  empty,
  headers,
  items,
  minWidthClassName = "min-w-[640px]",
  pageSize = PAGE_SIZES.admin,
  renderRow,
  resetKey,
  tableClassName,
}: {
  className?: string;
  empty?: React.ReactNode;
  headers: string[];
  items: T[];
  minWidthClassName?: string;
  pageSize?: number;
  renderRow: (item: T, index: number) => React.ReactNode;
  resetKey?: string | number | boolean;
  tableClassName?: string;
}) {
  const { page, pageItems, setPage, totalItems } = usePagedItems(
    items,
    pageSize,
    resetKey,
  );

  return (
    <div className={cn("min-w-0", className)}>
      <div className={cn("overflow-x-auto", tableClassName)}>
        <table className={cn("w-full text-sm", minWidthClassName)}>
          <thead>
            <tr>
              {headers.map((header) => (
                <th
                  className="border-b p-2 text-left first:pl-4 sm:first:pl-2"
                  key={header}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageItems.map((item, index) => renderRow(item, index))}
            {!items.length ? (
              <tr>
                <td
                  className="p-6 text-center text-muted-foreground"
                  colSpan={headers.length}
                >
                  {empty ?? "Nothing here yet."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <ClientPagination
        className="mt-4 px-1"
        onPageChange={setPage}
        page={page}
        pageSize={pageSize}
        totalItems={totalItems}
      />
    </div>
  );
}
