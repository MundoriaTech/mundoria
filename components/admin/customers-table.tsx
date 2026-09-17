"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  ClientPagination,
  usePagedItems,
} from "@/components/shared/pagination-controls";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/customer/services";
import { PAGE_SIZES } from "@/lib/pagination";

export type AdminCustomerRow = {
  avatar_url: string | null;
  created_at: string;
  email: string;
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

export function CustomersTable({
  customers,
}: {
  customers: AdminCustomerRow[];
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () =>
      customers.filter(
        (customer) =>
          !search ||
          `${customer.full_name} ${customer.email} ${customer.phone ?? ""}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [customers, search],
  );
  const { page, pageItems, setPage, totalItems } = usePagedItems(
    filtered,
    PAGE_SIZES.admin,
    search,
  );

  return (
    <div className="min-w-0">
      <label className="relative mb-5 block max-w-md">
        <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search customers"
          value={search}
        />
      </label>

      <div className="space-y-3 md:hidden">
        {pageItems.map((customer) => (
          <Link
            className="block rounded-xl border border-border bg-card p-4 transition active:bg-muted/40"
            href={`/admin/customer/${customer.id}`}
            key={customer.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{customer.full_name}</p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {customer.email}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {customer.stats.bookings} bookings ·{" "}
                  {formatMoney(customer.stats.spent)}
                </p>
              </div>
              <span className="shrink-0 text-sm font-medium text-primary">
                View
              </span>
            </div>
          </Link>
        ))}
        {!filtered.length ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            {customers.length
              ? "No customers match this search."
              : "No customer accounts yet."}
          </p>
        ) : null}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Customer</th>
              <th>Phone</th>
              <th>Bookings</th>
              <th>Completed</th>
              <th>Spend</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((customer) => (
              <tr className="border-t" key={customer.id}>
                <td className="p-3">
                  <b>{customer.full_name}</b>
                  <small className="block text-muted-foreground">
                    {customer.email}
                  </small>
                </td>
                <td>{customer.phone || "—"}</td>
                <td>{customer.stats.bookings}</td>
                <td>{customer.stats.completed}</td>
                <td>{formatMoney(customer.stats.spent)}</td>
                <td>
                  {new Date(customer.created_at).toLocaleDateString("en-GB")}
                </td>
                <td>
                  <Link
                    className="font-medium text-primary"
                    href={`/admin/customer/${customer.id}`}
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {!filtered.length ? (
              <tr>
                <td
                  className="p-8 text-center text-muted-foreground"
                  colSpan={7}
                >
                  {customers.length
                    ? "No customers match this search."
                    : "No customer accounts yet."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <ClientPagination
        className="mt-5"
        onPageChange={setPage}
        page={page}
        pageSize={PAGE_SIZES.admin}
        totalItems={totalItems}
      />
    </div>
  );
}
