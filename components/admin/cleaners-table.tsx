"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { TierBadge } from "@/components/cleaner/tier-badge";
import type { AdminCleaner } from "@/types/admin";

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
    <div>
      <div className="flex flex-wrap gap-2">
        {["all", "pending", "in_training", "certified", "active", "suspended", "removed"].map((value) => (
          <button
            className={`rounded-lg px-3 py-2 text-sm capitalize ${tab === value ? "bg-primary text-white" : "bg-muted"}`}
            key={value}
            onClick={() => setTab(value)}
          >
            {value === "pending" ? "Pending Review" : value.replace("_", " ")}
          </button>
        ))}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_12rem_12rem]">
        <label className="relative">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search cleaners"
          />
        </label>
        <select className="rounded-md border border-input bg-background px-3 text-sm text-foreground" onChange={(event) => setTier(event.target.value)}>
          <option value="">All tiers</option>
          {["bronze", "silver", "gold", "rose_gold"].map((value) => (
            <option key={value} value={value}>
              {value.replace("_", " ")}
            </option>
          ))}
        </select>
        <Input onChange={(event) => setArea(event.target.value)} placeholder="Working area" />
      </div>
      <div className="mt-5 overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th>Tier</th>
              <th>Medallion score</th>
              <th>Total Jobs</th>
              <th>Status</th>
              <th>Applied</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((cleaner) => (
              <tr className="border-t" key={cleaner.id}>
                <td className="p-3">
                  <b>{cleaner.full_name}</b>
                  <small className="block text-muted-foreground">{cleaner.email}</small>
                </td>
                <td>
                  {cleaner.cleaner_profiles ? (
                    <TierBadge tier={cleaner.cleaner_profiles.tier} />
                  ) : (
                    "—"
                  )}
                </td>
                <td>{cleaner.cleaner_profiles?.medallion_score ?? 0}</td>
                <td>{cleaner.cleaner_profiles?.total_jobs ?? 0}</td>
                <td className="capitalize">
                  {cleaner.cleaner_profiles?.status?.replaceAll("_", " ") ?? "—"}
                  {cleaner.cleaner_profiles?.onboarding_complete === false ? (
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Onboarding incomplete
                    </span>
                  ) : null}
                </td>
                <td>{new Date(cleaner.created_at).toLocaleDateString("en-GB")}</td>
                <td>
                  <Link className="font-medium text-primary" href={`/admin/cleaner/${cleaner.id}`}>
                    Review
                  </Link>
                </td>
              </tr>
            ))}
            {!filtered.length ? (
              <tr>
                <td className="p-8 text-center text-muted-foreground" colSpan={7}>
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
