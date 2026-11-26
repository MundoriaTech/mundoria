"use client";

import { SimpleSelect } from "@/components/ui/select";
import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  ClientPagination,
  usePagedItems,
} from "@/components/shared/pagination-controls";
import { formatMoney } from "@/lib/customer/services";
import { PAGE_SIZES } from "@/lib/pagination";

export type AdminCustomerRow = {
  addressLabel: string | null;
  avatar_url: string | null;
  created_at: string;
  email: string;
  extraAddressCount: number;
  full_name: string;
  id: string;
  phone: string | null;
  referral_code: string | null;
  stats: {
    bookings: number;
    completed: number;
    spent: number;
  };
};

const SORT_OPTS = [
  { value: "newest", label: "Sort: newest" },
  { value: "spend", label: "Sort: highest spend" },
  { value: "name", label: "Sort: name" },
];

const GRID = "minmax(220px,1.6fr) 160px minmax(220px,2fr) 90px 100px 90px 110px";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function matchesCustomerSearch(customer: AdminCustomerRow, raw: string) {
  const query = raw.trim().toLowerCase();
  if (!query) return true;
  const haystack = [customer.full_name, customer.email, customer.phone ?? "", customer.addressLabel ?? ""].join(" ").toLowerCase();
  if (haystack.includes(query)) return true;
  const queryDigits = digitsOnly(query);
  if (queryDigits.length >= 3) {
    if (digitsOnly(customer.phone ?? "").includes(queryDigits)) return true;
  }
  return false;
}

function initials(name: string) {
  return name.trim().split(/\s+/).map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export function CustomersTable({ customers }: { customers: AdminCustomerRow[] }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");

  const filtered = useMemo(
    () => customers.filter((c) => matchesCustomerSearch(c, search)),
    [customers, search],
  );

  const sorted = useMemo(() => {
    const copy = [...filtered];
    if (sort === "spend") copy.sort((a, b) => b.stats.spent - a.stats.spent);
    else if (sort === "name") copy.sort((a, b) => a.full_name.localeCompare(b.full_name));
    return copy;
  }, [filtered, sort]);

  const { page, pageItems, setPage, totalItems } = usePagedItems(sorted, PAGE_SIZES.admin, `${search}|${sort}`);

  return (
    <div className="flex flex-col gap-4 rounded-[18px] bg-white p-5">
      {/* Banner */}
      <div
        className="relative flex min-h-[70px] flex-wrap items-center justify-between gap-4 overflow-hidden rounded-[14px] px-6"
        style={{ background: "linear-gradient(90deg,#7F71B1 0%,#6A5BA6 55%,#524096 100%)" }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "repeating-linear-gradient(115deg,rgba(255,255,255,0.07) 0 70px,rgba(255,255,255,0) 70px 140px)" }}
        />
        <div className="relative flex flex-col gap-0.5">
          <h2 className="m-0 text-[22.8px] font-semibold leading-none text-white" style={{ letterSpacing: "-0.01em" }}>
            Customer list
          </h2>
          <span className="text-[15px] text-white">
            {filtered.length} customer{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        <label
          className="flex h-[46px] min-w-[280px] flex-1 items-center gap-2.5 rounded-full bg-[#F3F4F6] px-4"
          style={{ boxSizing: "border-box" }}
        >
          <Search className="h-[18px] w-[18px] shrink-0 text-[#5F5F66] opacity-60" strokeWidth={2} />
          <input
            className="min-w-0 flex-1 border-none bg-transparent text-[15px] text-black outline-none placeholder:text-[#8A8A8A]"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone, or address"
            value={search}
          />
        </label>

        <SimpleSelect
          aria-label="Sort customers"
          className="h-[46px] w-auto min-w-[10rem] shrink-0 rounded-full border-[1.5px] border-[#E1E1EA] px-4 text-[14.5px] font-semibold text-[#3D335F]"
          onChange={setSort}
          options={SORT_OPTS.map((o) => ({ label: o.label, value: o.value }))}
          value={sort}
        />
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {pageItems.map((customer) => (
          <Link
            className="block rounded-[14px] bg-[#F3F4F6] p-4 transition hover:bg-[#ECEAF5]"
            href={`/admin/customer/${customer.id}`}
            key={customer.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold">{customer.full_name}</p>
                <p className="mt-0.5 truncate text-[13.5px] text-[#5F5F66]">{customer.email}</p>
                {customer.addressLabel ? (
                  <p className="mt-2 line-clamp-2 text-xs text-[#5F5F66]">
                    {customer.addressLabel}
                    {customer.extraAddressCount > 0 ? ` · +${customer.extraAddressCount} more` : ""}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-[#5F5F66]">
                  {customer.stats.bookings} bookings · {formatMoney(customer.stats.spent)}
                </p>
              </div>
              <span className="shrink-0 text-[14px] font-semibold text-[#524096]">View</span>
            </div>
          </Link>
        ))}
        {!filtered.length && (
          <div className="rounded-[14px] bg-[#F3F4F6] px-5 py-12 text-center">
            <p className="text-[17.4px] font-semibold">
              {customers.length ? "No customers match this search." : "No customer accounts yet."}
            </p>
          </div>
        )}
      </div>

      {/* Desktop grid table */}
      <div className="hidden overflow-x-auto rounded-[18px] bg-[#F3F4F6] p-[6px] md:block">
        <div style={{ minWidth: "920px" }}>
          <div className="grid items-center gap-3 px-3 py-2.5" style={{ gridTemplateColumns: GRID }}>
            {["Customer", "Phone", "Address", "Bookings", "Completed", "Spend", "Joined"].map((col) => (
              <span className="text-[12.3px] font-semibold uppercase tracking-[0.1em] text-[#5F5F66]" key={col}>{col}</span>
            ))}
          </div>

          {pageItems.map((customer) => (
            <Link
              className="mb-[2px] grid cursor-pointer items-center gap-3 rounded-[12px] px-3 py-3 transition-colors hover:bg-white"
              href={`/admin/customer/${customer.id}`}
              key={customer.id}
              style={{ gridTemplateColumns: GRID }}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-bold text-[#524096]">
                  {initials(customer.full_name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold text-black">{customer.full_name}</span>
                  <span className="block truncate text-[12.3px] text-[#5F5F66]">{customer.email}</span>
                </span>
              </span>
              <span className="text-[15px] text-[#3D335F]">{customer.phone || "—"}</span>
              <span className="text-[14.5px] text-[#5F5F66]">
                {customer.addressLabel ? (
                  <>
                    <span className="line-clamp-2">{customer.addressLabel}</span>
                    {customer.extraAddressCount > 0 ? (
                      <span className="mt-0.5 block text-[12.3px] text-[#9999A0]">+{customer.extraAddressCount} more</span>
                    ) : null}
                  </>
                ) : (
                  <span className="text-[#9999A0]">—</span>
                )}
              </span>
              <span className="text-[15px] font-semibold text-[#523F97]">{customer.stats.bookings}</span>
              <span className="text-[15px] text-[#3D335F]">{customer.stats.completed}</span>
              <span className="text-right text-[15px] font-semibold text-[#523F97]">{formatMoney(customer.stats.spent)}</span>
              <span className="text-[14.5px] text-[#5F5F66]">
                {new Date(customer.created_at).toLocaleDateString("en-GB")}
              </span>
            </Link>
          ))}

          {!filtered.length && (
            <div className="px-5 py-12 text-center">
              <p className="text-[17.4px] font-semibold">
                {customers.length ? "No customers match this search." : "No customer accounts yet."}
              </p>
            </div>
          )}
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
