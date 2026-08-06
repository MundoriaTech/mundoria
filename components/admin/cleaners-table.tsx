"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { TierBadge } from "@/components/cleaner/tier-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { AdminCleaner } from "@/types/admin";

const STATUS_LABEL: Record<string, string> = {
  pending: "Needs review",
  in_training: "On hold",
  certified: "Approved",
  active: "Approved",
  suspended: "Suspended",
  removed: "Banned",
};

const TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Needs review" },
  { value: "in_training", label: "On hold" },
  { value: "certified", label: "Approved" },
  { value: "active", label: "Legacy" },
  { value: "suspended", label: "Suspended" },
  { value: "removed", label: "Banned" },
] as const;

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
        return (
          (tab === "all" ||
            (tab === "pending" && status === "pending") ||
            status === tab) &&
          (!search ||
            `${cleaner.full_name} ${cleaner.email}`
              .toLowerCase()
              .includes(search.toLowerCase())) &&
          (!tier || cleaner.cleaner_profiles?.tier === tier) &&
          (!area ||
            workingAreas[cleaner.id]?.some((prefix) =>
              prefix.startsWith(area.toUpperCase()),
            ))
        );
      }),
    [area, cleaners, search, tab, tier, workingAreas],
  );

  return (
    <div className="min-w-0">
      <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {TABS.map((item) => (
          <button
            className={`shrink-0 rounded-lg px-3 py-2 text-sm ${
              tab === item.value ? "bg-primary text-white" : "bg-muted"
            }`}
            key={item.value}
            onClick={() => setTab(item.value)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_11rem_11rem]">
        <label className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search cleaners"
          />
        </label>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          onChange={(event) => setTier(event.target.value)}
          value={tier}
        >
          <option value="">All tiers</option>
          {["bronze", "silver", "gold", "rose_gold"].map((value) => (
            <option key={value} value={value}>
              {value.replace("_", " ")}
            </option>
          ))}
        </select>
        <Input
          onChange={(event) => setArea(event.target.value)}
          placeholder="Working area"
          value={area}
        />
      </div>

      <div className="mt-5 space-y-3 md:hidden">
        {filtered.map((cleaner) => {
          const status = cleaner.cleaner_profiles?.status;
          return (
            <Link
              className="block rounded-xl border border-border bg-card p-4 transition active:bg-muted/40"
              href={`/admin/cleaner/${cleaner.id}`}
              key={cleaner.id}
            >
              <div className="flex items-start gap-3">
                <UserAvatar
                  name={cleaner.full_name}
                  seed={cleaner.id}
                  size="md"
                  url={cleaner.avatar_url}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold">{cleaner.full_name}</p>
                    {cleaner.cleaner_profiles ? (
                      <TierBadge
                        size="sm"
                        tier={cleaner.cleaner_profiles.tier}
                      />
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {cleaner.email}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      {STATUS_LABEL[status ?? ""] ??
                        status?.replaceAll("_", " ") ??
                        "—"}
                    </span>
                    <span>
                      Score {cleaner.cleaner_profiles?.medallion_score ?? 0}
                    </span>
                    <span>
                      {cleaner.cleaner_profiles?.total_jobs ?? 0} jobs
                    </span>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-medium text-primary">
                  Review
                </span>
              </div>
            </Link>
          );
        })}
        {!filtered.length ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            {cleaners.length
              ? "No cleaners match these filters."
              : "No cleaner accounts yet."}
          </p>
        ) : null}
      </div>

      <div className="mt-5 hidden overflow-x-auto rounded-xl border bg-card md:block">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th>Tier</th>
              <th>Score</th>
              <th>Jobs</th>
              <th>Status</th>
              <th>Applied</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((cleaner) => (
              <tr className="border-t" key={cleaner.id}>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      name={cleaner.full_name}
                      seed={cleaner.id}
                      size="sm"
                      url={cleaner.avatar_url}
                    />
                    <span>
                      <b>{cleaner.full_name}</b>
                      <small className="block text-muted-foreground">
                        {cleaner.email}
                      </small>
                    </span>
                  </div>
                </td>
                <td>
                  {cleaner.cleaner_profiles ? (
                    <TierBadge size="sm" tier={cleaner.cleaner_profiles.tier} />
                  ) : (
                    "—"
                  )}
                </td>
                <td>{cleaner.cleaner_profiles?.medallion_score ?? 0}</td>
                <td>{cleaner.cleaner_profiles?.total_jobs ?? 0}</td>
                <td>
                  {STATUS_LABEL[cleaner.cleaner_profiles?.status ?? ""] ??
                    cleaner.cleaner_profiles?.status?.replaceAll("_", " ") ??
                    "—"}
                  {cleaner.cleaner_profiles?.onboarding_complete === false ? (
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Onboarding incomplete
                    </span>
                  ) : null}
                </td>
                <td>
                  {new Date(cleaner.created_at).toLocaleDateString("en-GB")}
                </td>
                <td>
                  <Link
                    className="font-medium text-primary"
                    href={`/admin/cleaner/${cleaner.id}`}
                  >
                    Review
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
                  {cleaners.length
                    ? "No cleaners match these filters."
                    : "No cleaner accounts yet."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
