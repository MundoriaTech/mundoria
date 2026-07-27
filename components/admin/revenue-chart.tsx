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
    <section className="rounded-xl border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Revenue</h2>
          <p className="text-sm text-muted-foreground">Captured platform revenue</p>
        </div>
        <div className="flex rounded-lg bg-muted p-1">
          {(["daily", "weekly", "monthly"] as const).map((value) => (
            <Button
              key={value}
              onClick={() => setPeriod(value)}
              size="sm"
              variant={period === value ? "default" : "ghost"}
              className="capitalize"
            >
              {value}
            </Button>
          ))}
        </div>
      </div>
      <div className="mt-5 h-72">
        {hasRevenue ? (
          <ResponsiveContainer height="100%" width="100%">
            {period === "daily" ? (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" fontSize={11} tickLine={false} />
                <YAxis
                  fontSize={11}
                  tickFormatter={(value) => `£${Math.round(value / 100)}`}
                  tickLine={false}
                />
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
                <Bar dataKey="revenue" fill="#5a51aa" radius={[8, 8, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="revenue" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" fontSize={11} tickLine={false} />
                <YAxis
                  fontSize={11}
                  tickFormatter={(value) => `£${Math.round(value / 100)}`}
                  tickLine={false}
                />
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
                <Area
                  dataKey="revenue"
                  fill="url(#revenue)"
                  stroke="#059669"
                  strokeWidth={2}
                  type="monotone"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/30 text-center">
            <p className="font-semibold text-[#221f50]">No captured revenue yet</p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              This chart starts filling after jobs are completed and their held
              Stripe payments are captured.
            </p>
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
  const groups = new Map<string, number>();
  points.forEach((point) => {
    const date = new Date(`${point.date}T12:00:00`);
    let key = point.date;
    if (period === "weekly") {
      const start = new Date(date);
      start.setDate(date.getDate() - date.getDay());
      key = `W/C ${start.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`;
    } else if (period === "monthly") {
      key = date.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
    }
    groups.set(key, (groups.get(key) ?? 0) + point.revenue);
  });
  return Array.from(groups, ([date, revenue]) => ({ date, revenue }));
}
