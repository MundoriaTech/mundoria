"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { BookingStatusBadge } from "@/components/shared/booking-status-badge";
import { PriceDisplay } from "@/components/shared/price-display";
import { Input } from "@/components/ui/input";
import { formatServiceName, SERVICES } from "@/lib/customer/services";
import type { AdminBooking } from "@/types/admin";

export function BookingsTable({ bookings }: { bookings: AdminBooking[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [service, setService] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [zone, setZone] = useState("");
  const filtered = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          (!search ||
            booking.id.toLowerCase().includes(search.toLowerCase()) ||
            booking.customer?.full_name.toLowerCase().includes(search.toLowerCase())) &&
          (!status || booking.status === status) &&
          (!service || booking.service_type === service) &&
          (!from || booking.scheduled_date >= from) &&
          (!to || booking.scheduled_date <= to) &&
          (!zone || booking.address?.postcode.toUpperCase().startsWith(zone.toUpperCase())),
      ),
    [bookings, from, search, service, status, to, zone],
  );
  return (
    <div>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <label className="relative md:col-span-2">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" onChange={(event) => setSearch(event.target.value)} placeholder="Customer or booking ID" />
        </label>
        <select className="rounded-md border px-3 text-sm" onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          {["pending_match","matched","confirmed","cleaner_en_route","in_progress","awaiting_customer_confirmation","completed","cancelled","no_show","disputed"].map((value) => <option key={value}>{value}</option>)}
        </select>
        <select className="rounded-md border px-3 text-sm" onChange={(event) => setService(event.target.value)}>
          <option value="">All services</option>
          {SERVICES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <Input onChange={(event) => setFrom(event.target.value)} type="date" />
        <Input onChange={(event) => setTo(event.target.value)} type="date" />
        <Input onChange={(event) => setZone(event.target.value)} placeholder="Zone prefix" />
      </div>
      <div className="mt-5 overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="bg-muted/50 text-left"><tr><th className="p-3">ID</th><th>Customer</th><th>Cleaner</th><th>Service</th><th>Date</th><th>Status</th><th>Amount</th><th>Payment</th></tr></thead>
          <tbody>
            {filtered.map((booking) => (
              <tr className="border-t" key={booking.id}>
                <td className="p-3"><Link className="font-mono text-primary" href={`/admin/booking/${booking.id}`}>{booking.id.slice(0, 8)}</Link></td>
                <td>{booking.customer?.full_name ?? "—"}</td>
                <td>{booking.cleaner_profile?.full_name ?? "Unassigned"}</td>
                <td>{formatServiceName(booking.service_type)}</td>
                <td>{booking.scheduled_date}</td>
                <td><BookingStatusBadge status={booking.status} /></td>
                <td><PriceDisplay amount={booking.amount_total} /></td>
                <td className="capitalize">{booking.payment_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
