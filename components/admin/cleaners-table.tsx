"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { TierBadge } from "@/components/cleaner/tier-badge";
import {
  ClientPagination,
  usePagedItems,
} from "@/components/shared/pagination-controls";
import { UserAvatar } from "@/components/shared/user-avatar";
import { adminCleanerStatusLabel } from "@/lib/admin/cleaner-status";
import { ukDate } from "@/lib/admin/format";
import { PAGE_SIZES } from "@/lib/pagination";
import type { AdminCleaner } from "@/types/admin";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Needs review" },
  { value: "not_applied", label: "Not applied yet" },
  { value: "in_training", label: "On hold" },
  { value: "certified", label: "Approved" },
  { value: "active", label: "Legacy" },
  { value: "suspended", label: "Suspended" },
  { value: "removed", label: "Banned" },
] as const;

const GRID = "minmax(220px,1.6fr) 160px minmax(180px,1.4fr) 120px 70px 80px 120px 90px";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function areasLabel(areas: string[] | undefined) {
  if (!areas?.length) return null;
  const shown = areas.slice(0, 4).join(", ");
  return areas.length > 4 ? `${shown} +${areas.length - 4}` : shown;
}

function matchesCleanerSearch(cleaner: AdminCleaner, areas: string[] | undefined, raw: string) {
  const query = raw.trim().toLowerCase();
  if (!query) return true;
  const haystack = [cleaner.full_name, cleaner.email, cleaner.phone ?? "", ...(areas ?? [])].join(" ").toLowerCase();
  if (haystack.includes(query)) return true;
  const queryDigits = digitsOnly(query);
  if (queryDigits.length >= 3) {
    if (digitsOnly(cleaner.phone ?? "").includes(queryDigits)) return true;
  }
  return false;
}

export function CleanersTable({
  cleaners,
  workingAreas,
}: {
  cleaners: AdminCleaner[];
  workingAreas: Record<string, string[]>;
}) {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("");
  const [area, setArea] = useState("");

  const filtered = useMemo(
    () =>
      cleaners.filter((cleaner) => {
        const status = cleaner.cleaner_profiles?.status;
        const areas = workingAreas[cleaner.id];
        return (
          (tab === "all" ||
            // Applied and waiting; people who signed up but never finished the
            // application have their own tab.
            (tab === "pending" && status === "pending" && cleaner.cleaner_profiles?.onboarding_complete !== false) ||
            (tab === "not_applied" && status === "pending" && cleaner.cleaner_profiles?.onboarding_complete === false) ||
            (tab !== "pending" && tab !== "not_applied" && status === tab)) &&
          matchesCleanerSearch(cleaner, areas, search) &&
          (!tier || cleaner.cleaner_profiles?.tier === tier) &&
          (!area || areas?.some((prefix) => prefix.startsWith(area.toUpperCase())))
        );
      }),
    [area, cleaners, search, tab, tier, workingAreas],
  );
  const filterKey = `${tab}|${search}|${tier}|${area}`;
  const { page, pageItems, setPage, totalItems } = usePagedItems(filtered, PAGE_SIZES.admin, filterKey);

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
            All cleaners
          </h2>
          <span className="text-[15px] text-white">
            {filtered.length} cleaner{filtered.length !== 1 ? "s" : ""}
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
            placeholder="Search name, email, phone, or area"
            value={search}
          />
        </label>

        <div className="flex h-[46px] shrink-0 items-center gap-1 overflow-x-auto rounded-full bg-[#E7E7EF] px-[5px]">
          {STATUS_TABS.map((t) => (
            <button
              className="whitespace-nowrap rounded-full text-[14.5px] font-semibold transition-colors"
              key={t.value}
              onClick={() => setTab(t.value)}
              style={{
                height: "36px", padding: "0 14px", border: "none", cursor: "pointer", fontFamily: "inherit",
                background: tab === t.value ? "#524096" : "transparent",
                color: tab === t.value ? "#FFFFFF" : "#524096",
              }}
              type="button"
            >
              {t.label}
            </button>
          ))}
        </div>

        <select
          className="h-[46px] shrink-0 rounded-full bg-white text-[14.5px] font-semibold text-[#3D335F] outline-none"
          onChange={(e) => setTier(e.target.value)}
          style={{ padding: "0 36px 0 16px", border: "1.5px solid #E1E1EA", cursor: "pointer" }}
          value={tier}
        >
          <option value="">All tiers</option>
          {["bronze", "silver", "gold", "rose_gold"].map((value) => (
            <option key={value} value={value}>{value.replace("_", " ")}</option>
          ))}
        </select>

        <label
          className="flex h-[46px] shrink-0 items-center rounded-full bg-white px-[14px]"
          style={{ width: "150px", border: "1.5px solid #E1E1EA" }}
        >
          <input
            className="w-full border-none bg-transparent text-[14.5px] text-black outline-none placeholder:text-[#8A8A8A]"
            onChange={(e) => setArea(e.target.value)}
            placeholder="Working area"
            value={area}
          />
        </label>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {pageItems.map((cleaner) => {
          const status = cleaner.cleaner_profiles?.status;
          const areas = areasLabel(workingAreas[cleaner.id]);
          return (
            <Link
              className="block rounded-[14px] bg-[#F3F4F6] p-4 transition hover:bg-[#ECEAF5]"
              href={`/admin/cleaners/${cleaner.id}`}
              key={cleaner.id}
            >
              <div className="flex items-start gap-3">
                <UserAvatar name={cleaner.full_name} seed={cleaner.id} size="md" url={cleaner.avatar_url} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold">{cleaner.full_name}</p>
                    {cleaner.cleaner_profiles ? <TierBadge size="sm" tier={cleaner.cleaner_profiles.tier} /> : null}
                  </div>
                  <p className="mt-0.5 truncate text-[13.5px] text-[#5F5F66]">{cleaner.email}</p>
                  {areas ? <p className="mt-2 text-xs text-[#5F5F66]">Areas: {areas}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#5F5F66]">
                    <span>{status ? adminCleanerStatusLabel(status) : "—"}</span>
                    <span>Score {cleaner.cleaner_profiles?.medallion_score ?? 0}</span>
                    <span>{cleaner.cleaner_profiles?.total_jobs ?? 0} jobs</span>
                  </div>
                </div>
                <span className="shrink-0 text-[14px] font-semibold text-[#524096]">Review</span>
              </div>
            </Link>
          );
        })}
        {!filtered.length && (
          <div className="rounded-[14px] bg-[#F3F4F6] px-5 py-12 text-center">
            <p className="text-[17.4px] font-semibold">
              {cleaners.length ? "No cleaners match these filters." : "No cleaner accounts yet."}
            </p>
          </div>
        )}
      </div>

      {/* Desktop grid table */}
      <div className="hidden overflow-x-auto rounded-[18px] bg-[#F3F4F6] p-[6px] md:block">
        <div style={{ minWidth: "960px" }}>
          <div className="grid items-center gap-3 px-3 py-2.5" style={{ gridTemplateColumns: GRID }}>
            {["Name", "Phone", "Areas", "Tier", "Score", "Jobs", "Status", "Applied"].map((col) => (
              <span className="text-[12.3px] font-semibold uppercase tracking-[0.1em] text-[#5F5F66]" key={col}>{col}</span>
            ))}
          </div>

          {pageItems.map((cleaner) => {
            const areas = areasLabel(workingAreas[cleaner.id]);
            const status = cleaner.cleaner_profiles?.status;
            return (
              <Link
                className="mb-[2px] grid cursor-pointer items-center gap-3 rounded-[12px] px-3 py-3 transition-colors hover:bg-white"
                href={`/admin/cleaners/${cleaner.id}`}
                key={cleaner.id}
                style={{ gridTemplateColumns: GRID }}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <UserAvatar
                    className="shrink-0"
                    name={cleaner.full_name}
                    seed={cleaner.id}
                    size="sm"
                    url={cleaner.avatar_url}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold text-black">{cleaner.full_name}</span>
                    <span className="block truncate text-[12.3px] text-[#5F5F66]">{cleaner.email}</span>
                  </span>
                </span>
                <span className="text-[15px] text-[#3D335F]">{cleaner.phone || "—"}</span>
                <span className="text-[14.5px] text-[#5F5F66]">
                  {areas ? <span className="line-clamp-2">{areas}</span> : <span className="text-[#9999A0]">—</span>}
                </span>
                <span>
                  {cleaner.cleaner_profiles ? <TierBadge size="sm" tier={cleaner.cleaner_profiles.tier} /> : <span className="text-[#9999A0]">—</span>}
                </span>
                <span className="text-[15px] font-semibold text-[#523F97]">{cleaner.cleaner_profiles?.medallion_score ?? 0}</span>
                <span className="text-[15px] text-[#3D335F]">{cleaner.cleaner_profiles?.total_jobs ?? 0}</span>
                <span className="text-[14.5px] text-[#3D335F]">
                  {status ? adminCleanerStatusLabel(status) : "—"}
                  {cleaner.cleaner_profiles?.onboarding_complete === false ? (
                    <span className="mt-0.5 block text-xs text-[#5F5F66]">Onboarding incomplete</span>
                  ) : null}
                </span>
                <span className="text-[14.5px] text-[#5F5F66]">
                  {/* Application submitted; signup date until they submit. */}
                  {(cleaner.cleaner_profiles as { info_accuracy_confirmed_at?: string | null } | null)?.info_accuracy_confirmed_at
                    ? ukDate((cleaner.cleaner_profiles as { info_accuracy_confirmed_at?: string | null }).info_accuracy_confirmed_at)
                    : <span title="Signed up; application not submitted">{ukDate(cleaner.created_at)} (signed up)</span>}
                </span>
              </Link>
            );
          })}

          {!filtered.length && (
            <div className="px-5 py-12 text-center">
              <p className="text-[17.4px] font-semibold">
                {cleaners.length ? "No cleaners match these filters." : "No cleaner accounts yet."}
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
