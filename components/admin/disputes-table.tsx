"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import type { AdminDispute } from "@/types/admin";

export function DisputesTable({ disputes }: { disputes: AdminDispute[] }) {
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const rows = useMemo(
    () =>
      disputes.filter(
        (item) =>
          (!type || item.type === type) &&
          (!status || item.status === status) &&
          (!date || item.created_at.startsWith(date)),
      ),
    [date, disputes, status, type],
  );

  return (
    <div className="min-w-0">
      <div className="grid gap-3 sm:grid-cols-3">
        <select
          className="h-11 rounded-md border border-input bg-background px-3 text-foreground"
          onChange={(event) => setType(event.target.value)}
          value={type}
        >
          <option value="">All types</option>
          {["damage", "no_show", "quality", "payment", "other"].map((value) => (
            <option key={value} value={value}>
              {value.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <select
          className="h-11 rounded-md border border-input bg-background px-3 text-foreground"
          onChange={(event) => setStatus(event.target.value)}
          value={status}
        >
          <option value="">All statuses</option>
          {["open", "under_review", "resolved", "closed"].map((value) => (
            <option key={value} value={value}>
              {value.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <Input
          onChange={(event) => setDate(event.target.value)}
          type="date"
          value={date}
        />
      </div>

      <div className="mt-5 space-y-3 md:hidden">
        {rows.map((item) => (
          <Link
            className="block rounded-xl border border-border bg-card p-4 transition active:bg-muted/40"
            href={`/admin/disputes/${item.id}`}
            key={item.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold capitalize">
                  {item.type.replaceAll("_", " ")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.raised_by_profile?.full_name ?? "Unknown"} ·{" "}
                  {new Date(item.created_at).toLocaleDateString("en-GB")}
                </p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  Booking {item.booking_id.slice(0, 8)}
                </p>
              </div>
              <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs capitalize">
                {item.status.replaceAll("_", " ")}
              </span>
            </div>
          </Link>
        ))}
        {!rows.length ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No disputes match these filters.
          </p>
        ) : null}
      </div>

      <div className="mt-5 hidden overflow-x-auto rounded-xl border bg-card md:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-muted/50 text-left">
              <th className="p-3">Created</th>
              <th>Type</th>
              <th>Booking</th>
              <th>Raised by</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr className="border-t" key={item.id}>
                <td className="p-3">
                  {new Date(item.created_at).toLocaleDateString("en-GB")}
                </td>
                <td className="capitalize">
                  {item.type.replaceAll("_", " ")}
                </td>
                <td>{item.booking_id.slice(0, 8)}</td>
                <td>{item.raised_by_profile?.full_name ?? "Unknown"}</td>
                <td className="capitalize">
                  {item.status.replaceAll("_", " ")}
                </td>
                <td>
                  <Link
                    className="text-primary"
                    href={`/admin/disputes/${item.id}`}
                  >
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
