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
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        <select className="h-11 rounded-md border border-input bg-background px-3 text-foreground" onChange={(event) => setType(event.target.value)}>
          <option value="">All types</option>
          {["damage", "no_show", "quality", "payment", "other"].map((value) => <option key={value}>{value}</option>)}
        </select>
        <select className="h-11 rounded-md border border-input bg-background px-3 text-foreground" onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          {["open", "under_review", "resolved", "closed"].map((value) => <option key={value}>{value}</option>)}
        </select>
        <Input onChange={(event) => setDate(event.target.value)} type="date" />
      </div>
      <div className="mt-5 overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[700px] text-sm">
          <thead><tr className="bg-muted/50 text-left"><th className="p-3">Created</th><th>Type</th><th>Booking</th><th>Raised by</th><th>Status</th><th></th></tr></thead>
          <tbody>{rows.map((item) => <tr className="border-t" key={item.id}><td className="p-3">{new Date(item.created_at).toLocaleDateString("en-GB")}</td><td className="capitalize">{item.type.replaceAll("_"," ")}</td><td>{item.booking_id.slice(0,8)}</td><td>{item.raised_by_profile?.full_name ?? "Unknown"}</td><td className="capitalize">{item.status.replaceAll("_"," ")}</td><td><Link className="text-primary" href={`/admin/disputes/${item.id}`}>Review</Link></td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
