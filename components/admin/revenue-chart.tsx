"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/customer/services";
import type { RevenuePoint } from "@/types/admin";

export function RevenueChart({ points }: { points: RevenuePoint[] }) {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const data = aggregate(points, period);
  const hasRevenue = data.some((point) => point.revenue > 0);

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.5rem] border border-[#e8e0f4] bg-white p-4 shadow-[0_12px_28px_rgba(49,44,121,0.04)] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-[#1c133b]">Revenue</h2>
          <p className="text-sm text-[#5a5470]">Captured platform revenue</p>
        </div>
        <div className="flex w-full rounded-full bg-[#f3eef8] p-1 sm:w-auto">
          {(["daily", "weekly", "monthly"] as const).map((value) => (
            <Button
              key={value}
              onClick={() => setPeriod(value)}
              size="sm"
              variant={period === value ? "default" : "ghost"}
              className={
                period === value
                  ? "flex-1 rounded-full capitalize sm:flex-none"
                  : "flex-1 rounded-full capitalize text-[#5a5470] sm:flex-none"
              }
            >
              {value}
            </Button>
          ))}
        </div>
      </div>
      <div className="mt-5 h-56 min-w-0 sm:h-72">
        {hasRevenue ? (
          <ResponsiveContainer height="100%" width="100%">
            {period === "daily" ? (
              <BarChart data={data}>
                <CartesianGrid stroke="#efe8f8" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="label"
                  tick={{ fill: "#8b8798", fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  tick={{ fill: "#8b8798", fontSize: 11 }}
                  tickFormatter={(value) => formatMoney(Number(value))}
                  tickLine={false}
                  width={72}
                />
                <Tooltip
                  contentStyle={{
                    border: "1px solid #e8e0f4",
                    borderRadius: 12,
                    background: "#fff",
                  }}
                  formatter={(value) => formatMoney(Number(value))}
                />
                <Bar dataKey="revenue" fill="#823fb2" radius={[8, 8, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="magRevenue" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#823fb2" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#823fb2" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#efe8f8" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="label"
                  tick={{ fill: "#8b8798", fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  tick={{ fill: "#8b8798", fontSize: 11 }}
                  tickFormatter={(value) => formatMoney(Number(value))}
                  tickLine={false}
                  width={72}
                />
                <Tooltip
                  contentStyle={{
                    border: "1px solid #e8e0f4",
                    borderRadius: 12,
                    background: "#fff",
                  }}
                  formatter={(value) => formatMoney(Number(value))}
                />
                <Area
                  dataKey="revenue"
                  fill="url(#magRevenue)"
                  stroke="#1c133b"
                  strokeWidth={2}
                  type="monotone"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl bg-[#f7f4fb] text-sm text-[#5a5470]">
            No captured revenue yet for this view.
          </div>
        )}
      </div>
    </section>
  );
}

function aggregate(
  points: RevenuePoint[],
  period: "daily" | "weekly" | "monthly",
) {
  const buckets = new Map<string, number>();
  for (const point of points) {
    const key =
      period === "daily"
        ? point.date
        : period === "weekly"
          ? weekKey(point.date)
          : point.date.slice(0, 7);
    buckets.set(key, (buckets.get(key) ?? 0) + point.revenue);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([label, revenue]) => ({ label, revenue }));
}

function weekKey(date: string) {
  const d = new Date(`${date}T12:00:00`);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return d.toISOString().slice(0, 10);
}
