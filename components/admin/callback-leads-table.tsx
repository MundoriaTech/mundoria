"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  ClientPagination,
  usePagedItems,
} from "@/components/shared/pagination-controls";
import {
  CALLBACK_CALL_LABELS,
  CALLBACK_FILTERS,
  CALLBACK_OUTCOME_LABELS,
  filterCallbackLeads,
  type CallbackDeskFilter,
  type CallbackLeadRow,
} from "@/lib/admin/callback-desk";
import { PAGE_SIZES } from "@/lib/pagination";

const GRID = "minmax(200px,1.4fr) 160px 120px 140px minmax(140px,1fr) 88px";

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
  const [filter, setFilter] = useState<CallbackDeskFilter>("to_call");
  const visible = useMemo(
    () => filterCallbackLeads(rows, filter),
    [filter, rows],
  );
  const { page, pageItems, setPage, totalItems } = usePagedItems(
    visible,
    PAGE_SIZES.admin,
    filter,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-1 rounded-full bg-[#E7E7EF] px-[5px] py-[5px] sm:h-[46px] sm:py-0">
        {CALLBACK_FILTERS.map((item) => {
          const active = filter === item.id;
          const count = filterCallbackLeads(rows, item.id).length;
          return (
            <button
              className="whitespace-nowrap rounded-full text-[14.5px] font-semibold"
              key={item.id}
              onClick={() => setFilter(item.id)}
              style={{
                background: active ? "#524096" : "transparent",
                border: "none",
                color: active ? "#FFFFFF" : "#524096",
                cursor: "pointer",
                fontFamily: "inherit",
                height: "36px",
                padding: "0 14px",
              }}
              type="button"
            >
              {item.label}
              {` (${item.id === "all" ? rows.length : count})`}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {pageItems.map((row) => (
          <Link
            className="block rounded-[14px] bg-[#F3F4F6] p-4 transition hover:bg-[#ECEAF5]"
            href={`/admin/callback-leads/${row.id}`}
            key={row.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="m-0 truncate text-[15px] font-semibold text-[#1c133b]">
                  {row.first_name} {row.last_name}
                </p>
                <p className="mt-0.5 mb-0 text-[13.5px] text-[#5F5F66]">{row.phone}</p>
                <p className="mt-2 mb-0 text-[13px] text-[#5F5F66]">
                  {CALLBACK_CALL_LABELS[row.call_status]}
                  {row.outcome
                    ? ` · ${CALLBACK_OUTCOME_LABELS[row.outcome]}`
                    : ""}
                </p>
              </div>
              <span className="shrink-0 text-[14px] font-semibold text-[#524096]">
                Open
              </span>
            </div>
          </Link>
        ))}
        {!visible.length ? (
          <div className="rounded-[14px] bg-[#F3F4F6] px-5 py-12 text-center">
            <p className="m-0 text-[17.4px] font-semibold">No callback leads in this view.</p>
          </div>
        ) : null}
      </div>

      <div className="hidden overflow-x-auto rounded-[18px] bg-[#F3F4F6] p-[6px] md:block">
        <div style={{ minWidth: "880px" }}>
          <div
            className="grid items-center gap-3 px-3 py-2.5"
            style={{ gridTemplateColumns: GRID }}
          >
            {["Name", "Phone", "Call", "Outcome", "When", ""].map((col) => (
              <span
                className="text-[12.3px] font-semibold uppercase tracking-[0.1em] text-[#5F5F66]"
                key={col || "open"}
              >
                {col}
              </span>
            ))}
          </div>
          {pageItems.map((row) => (
            <Link
              className="mb-[2px] grid items-center gap-3 rounded-[12px] px-3 py-3 transition-colors hover:bg-white"
              href={`/admin/callback-leads/${row.id}`}
              key={row.id}
              style={{ gridTemplateColumns: GRID }}
            >
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-semibold text-[#1c133b]">
                  {row.first_name} {row.last_name}
                </span>
                <span className="block truncate text-[12.3px] text-[#5F5F66]">
                  {row.notes || row.email}
                </span>
              </span>
              <span className="text-[15px] text-[#3D335F]">{row.phone}</span>
              <span className="text-[14.5px] text-[#3D335F]">
                {CALLBACK_CALL_LABELS[row.call_status]}
              </span>
              <span className="text-[14.5px] text-[#3D335F]">
                {row.outcome ? CALLBACK_OUTCOME_LABELS[row.outcome] : "—"}
              </span>
              <span className="text-[14.5px] text-[#5F5F66]">
                {row.available_in_10_min ? "10 min · " : ""}
                {formatWhen(row.created_at)}
              </span>
              <span className="justify-self-end text-[14px] font-semibold text-[#524096]">
                Open
              </span>
            </Link>
          ))}
          {!visible.length ? (
            <div className="px-5 py-12 text-center">
              <p className="m-0 text-[17.4px] font-semibold">
                No callback leads in this view.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <ClientPagination
        onPageChange={setPage}
        page={page}
        pageSize={PAGE_SIZES.admin}
        totalItems={totalItems}
      />
    </div>
  );
}
