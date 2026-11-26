"use client";

import { SimpleSelect } from "@/components/ui/select";
import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  ClientPagination,
  usePagedItems,
} from "@/components/shared/pagination-controls";
import { PriceDisplay } from "@/components/shared/price-display";
import { formatServiceName, SERVICES } from "@/lib/customer/services";
import { PAGE_SIZES } from "@/lib/pagination";
import type { AdminBooking } from "@/types/admin";
import type { BookingStatus } from "@/types/customer";

const STATUS_PILL: Record<BookingStatus, { bg: string; color: string; label: string }> = {
  pending_match:    { bg: "#FFF5E6", color: "#C17E24", label: "Pending match" },
  matched:          { bg: "#FFF5E6", color: "#C17E24", label: "Matched" },
  awaiting_payment: { bg: "#FFF5E6", color: "#C17E24", label: "Awaiting payment" },
  confirmed:        { bg: "#EAE7F5", color: "#524096", label: "Confirmed" },
  cleaner_en_route: { bg: "#E8F0FF", color: "#2D5BE3", label: "En route" },
  in_progress:      { bg: "#E0F4EB", color: "#1A7A4A", label: "In progress" },
  awaiting_customer_confirmation: { bg: "#E0F4EB", color: "#1A7A4A", label: "Confirm clean" },
  completed:        { bg: "#E0F4EB", color: "#1A7A4A", label: "Completed" },
  cancelled:        { bg: "#F0F0F0", color: "#6B6B70", label: "Cancelled" },
  no_show:          { bg: "#FEE9E9", color: "#C0272D", label: "No show" },
  disputed:         { bg: "#FEE9E9", color: "#C0272D", label: "Disputed" },
};

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "pending_match", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "disputed", label: "Disputed" },
];

const GRID = "minmax(90px,90px) minmax(140px,1.2fr) minmax(120px,1fr) minmax(180px,1.6fr) 100px minmax(140px,160px) 85px 85px";

function initials(name: string) {
  return name.trim().split(/\s+/).map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function StatusPill({ status }: { status: BookingStatus }) {
  const pill = STATUS_PILL[status];
  if (!pill) return <span className="text-[#5F5F66]">—</span>;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full text-[13.5px] font-semibold"
      style={{ height: "28px", padding: "0 12px", background: pill.bg, color: pill.color }}
    >
      <span className="rounded-full" style={{ width: "6px", height: "6px", background: pill.color, flexShrink: 0 }} />
      {pill.label}
    </span>
  );
}

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
            booking.customer?.full_name?.toLowerCase().includes(search.toLowerCase())) &&
          (!status || booking.status === status) &&
          (!service || booking.service_type === service) &&
          (!from || booking.scheduled_date >= from) &&
          (!to || booking.scheduled_date <= to) &&
          (!zone ||
            booking.address?.postcode?.toUpperCase().startsWith(zone.toUpperCase())),
      ),
    [bookings, from, search, service, status, to, zone],
  );
  const filterKey = `${search}|${status}|${service}|${from}|${to}|${zone}`;
  const { page, pageItems, setPage, totalItems } = usePagedItems(filtered, PAGE_SIZES.admin, filterKey);
  const hasFilters = !!(search || status || service || from || to || zone);

  function clearAll() {
    setSearch(""); setStatus(""); setService(""); setFrom(""); setTo(""); setZone("");
  }

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
            All bookings
          </h2>
          <span className="text-[15px] text-white">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        <label
          className="flex h-[46px] min-w-[220px] flex-1 items-center gap-2.5 rounded-full bg-[#F3F4F6] px-4"
          style={{ boxSizing: "border-box" }}
        >
          <Search className="h-[18px] w-[18px] shrink-0 text-[#5F5F66] opacity-60" strokeWidth={2} />
          <input
            className="min-w-0 flex-1 border-none bg-transparent text-[15px] text-black outline-none placeholder:text-[#8A8A8A]"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Customer or booking ID"
            value={search}
          />
        </label>

        <div className="flex h-[46px] shrink-0 items-center gap-1 rounded-full bg-[#E7E7EF] px-[5px]">
          {STATUS_TABS.map((t) => (
            <button
              className="whitespace-nowrap rounded-full text-[14.5px] font-semibold transition-colors"
              key={t.value}
              onClick={() => setStatus(t.value)}
              style={{
                height: "36px", padding: "0 14px", border: "none", cursor: "pointer", fontFamily: "inherit",
                background: status === t.value ? "#524096" : "transparent",
                color: status === t.value ? "#FFFFFF" : "#524096",
              }}
              type="button"
            >
              {t.label}
            </button>
          ))}
        </div>

        <SimpleSelect
          aria-label="Service"
          className="h-[46px] w-auto min-w-[10rem] shrink-0 rounded-full border-[1.5px] border-[#E1E1EA] px-4 text-[14.5px] font-semibold text-[#3D335F]"
          emptyLabel="All services"
          onChange={setService}
          options={SERVICES.map((item) => ({ label: item.label, value: item.value }))}
          value={service}
        />

        <label
          className="flex h-[46px] shrink-0 items-center gap-2 rounded-full bg-white px-[14px] text-[13.5px] text-[#5F5F66]"
          style={{ border: "1.5px solid #E1E1EA" }}
        >
          From
          <input className="border-none bg-transparent text-[14.5px] text-[#3D335F] outline-none" onChange={(e) => setFrom(e.target.value)} type="date" value={from} />
        </label>

        <label
          className="flex h-[46px] shrink-0 items-center gap-2 rounded-full bg-white px-[14px] text-[13.5px] text-[#5F5F66]"
          style={{ border: "1.5px solid #E1E1EA" }}
        >
          To
          <input className="border-none bg-transparent text-[14.5px] text-[#3D335F] outline-none" onChange={(e) => setTo(e.target.value)} type="date" value={to} />
        </label>

        <label
          className="flex h-[46px] shrink-0 items-center rounded-full bg-white px-[14px]"
          style={{ width: "150px", border: "1.5px solid #E1E1EA" }}
        >
          <input
            className="w-full border-none bg-transparent text-[14.5px] text-black outline-none placeholder:text-[#8A8A8A]"
            onChange={(e) => setZone(e.target.value)}
            placeholder="Zone prefix"
            value={zone}
          />
        </label>

        {hasFilters && (
          <button
            className="shrink-0 text-[14.5px] font-semibold text-[#524096] underline"
            onClick={clearAll}
            style={{ background: "none", border: "none", cursor: "pointer" }}
            type="button"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 lg:hidden">
        {pageItems.map((booking) => {
          const pill = STATUS_PILL[booking.status as BookingStatus];
          return (
            <Link
              className="block rounded-[14px] bg-[#F3F4F6] p-4 transition hover:bg-[#ECEAF5]"
              href={`/admin/booking/${booking.id}`}
              key={booking.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold">{booking.customer?.full_name ?? "Customer"}</p>
                  <p className="mt-0.5 truncate text-[13.5px] text-[#5F5F66]">
                    {formatServiceName(booking.service_type)}
                    {booking.estimated_duration_hours != null
                      ? ` · ${booking.estimated_duration_hours}h`
                      : ""}{" "}
                    · {booking.scheduled_date}
                  </p>
                  <p className="mt-1 font-mono text-xs text-[#5F5F66]">{booking.id.slice(0, 8)}</p>
                </div>
                {pill && (
                  <span
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full text-[13.5px] font-semibold"
                    style={{ height: "28px", padding: "0 12px", background: pill.bg, color: pill.color }}
                  >
                    <span className="rounded-full" style={{ width: "6px", height: "6px", background: pill.color, flexShrink: 0 }} />
                    {pill.label}
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[13.5px]">
                <span className="text-[#5F5F66]">{booking.cleaner_profile?.full_name ?? "Unassigned"}</span>
                <span className="font-semibold text-[#523F97]"><PriceDisplay amount={booking.amount_total} /></span>
              </div>
            </Link>
          );
        })}
        {!filtered.length && (
          <div className="rounded-[14px] bg-[#F3F4F6] px-5 py-12 text-center">
            <p className="text-[17.4px] font-semibold">No bookings match these filters</p>
            {hasFilters && (
              <button className="mt-2 text-[15px] font-semibold text-[#524096] underline" onClick={clearAll} style={{ background: "none", border: "none", cursor: "pointer" }} type="button">
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Desktop grid table */}
      <div className="hidden overflow-x-auto rounded-[18px] bg-[#F3F4F6] p-[6px] lg:block">
        <div style={{ minWidth: "960px" }}>
          <div className="grid items-center gap-2 px-3 py-2.5" style={{ gridTemplateColumns: GRID }}>
            {["ID", "Customer", "Cleaner", "Service", "Date", "Status", "Amount", "Payment"].map((col) => (
              <span className="text-[12.3px] font-semibold uppercase tracking-[0.1em] text-[#5F5F66]" key={col}>{col}</span>
            ))}
          </div>

          {pageItems.map((booking) => {
            const customerName = booking.customer?.full_name ?? "—";
            return (
              <Link
                className="mb-[2px] grid cursor-pointer items-center gap-2 rounded-[12px] px-3 py-3 transition-colors hover:bg-white"
                href={`/admin/booking/${booking.id}`}
                key={booking.id}
                style={{ gridTemplateColumns: GRID }}
              >
                <span className="font-mono text-[13.5px] font-medium text-[#524096]">{booking.id.slice(0, 8)}</span>
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[12.3px] font-bold text-[#524096]">
                    {initials(customerName)}
                  </span>
                  <span className="truncate text-[15px] font-semibold text-black">{customerName}</span>
                </span>
                <span className="truncate text-[15px] text-[#5F5F66]">{booking.cleaner_profile?.full_name ?? "Unassigned"}</span>
                <span className="truncate text-[15px] text-[#3D335F]">
                  {formatServiceName(booking.service_type)}
                  {booking.estimated_duration_hours != null
                    ? ` · ${booking.estimated_duration_hours}h`
                    : ""}
                </span>
                <span className="tabular-nums text-[14.5px] text-[#3D335F]">{booking.scheduled_date}</span>
                <StatusPill status={booking.status as BookingStatus} />
                <span className="text-right text-[15px] font-semibold tabular-nums text-[#523F97]">
                  <PriceDisplay amount={booking.amount_total} />
                </span>
                <span
                  className="text-right text-[14.5px] font-semibold capitalize"
                  style={{ color: booking.payment_status === "released" ? "#1A7A4A" : "#C17E24" }}
                >
                  {booking.payment_status}
                </span>
              </Link>
            );
          })}

          {!filtered.length && (
            <div className="px-5 py-12 text-center">
              <p className="text-[17.4px] font-semibold">No bookings match these filters</p>
              {hasFilters && (
                <button className="mt-2 text-[15px] font-semibold text-[#524096] underline" onClick={clearAll} style={{ background: "none", border: "none", cursor: "pointer" }} type="button">
                  Clear filters
                </button>
              )}
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
