"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/customer/services";

interface Promo {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_uses: number | null;
  uses_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
}

export function PromosManager({ promos }: { promos: Promo[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    max_uses: "",
    valid_from: "",
    valid_until: "",
  });

  async function save(payload: Record<string, unknown>) {
    setError(null);
    const response = await fetch("/api/admin/promos", {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    if (!response.ok) {
      setError(result.error ?? "Could not save promo.");
      return;
    }
    setForm({
      code: "",
      discount_type: "percentage",
      discount_value: "",
      max_uses: "",
      valid_from: "",
      valid_until: "",
    });
    router.refresh();
  }

  return (
    <div>
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Create promo code</h2>
        {error ? (
          <p className="mt-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Input
            onChange={(e) =>
              setForm({ ...form, code: e.target.value.toUpperCase() })
            }
            placeholder="CLEAN10"
            value={form.code}
          />
          <select
            className="rounded-md border border-input bg-background px-3 text-foreground"
            onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
            value={form.discount_type}
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed (£)</option>
          </select>
          <Input
            min={0}
            onChange={(e) =>
              setForm({ ...form, discount_value: e.target.value })
            }
            placeholder="Value"
            type="number"
            value={form.discount_value}
          />
          <Input
            min={1}
            onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
            placeholder="Max uses"
            type="number"
            value={form.max_uses}
          />
          <Input
            onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
            type="datetime-local"
            value={form.valid_from}
          />
          <Input
            onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
            type="datetime-local"
            value={form.valid_until}
          />
        </div>
        <Button
          className="mt-4"
          disabled={!form.code || !form.discount_value}
          onClick={() =>
            void save({
              action: "create",
              ...form,
              discount_type: form.discount_type,
              discount_value: Number(form.discount_value),
              max_uses: form.max_uses ? Number(form.max_uses) : null,
            })
          }
        >
          Create promo
        </Button>
      </section>
      <div className="mt-6 overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="bg-muted/50 text-left">
              <th className="p-3">Code</th>
              <th>Discount</th>
              <th>Usage</th>
              <th>Validity</th>
              <th>Status</th>
              <th>Analytics</th>
            </tr>
          </thead>
          <tbody>
            {promos.map((promo) => (
              <tr className="border-t" key={promo.id}>
                <td className="p-3 font-mono font-bold">{promo.code}</td>
                <td>
                  {promo.discount_type === "percentage"
                    ? `${promo.discount_value}%`
                    : formatMoney(promo.discount_value)}
                </td>
                <td>
                  {promo.uses_count}/{promo.max_uses ?? "∞"}
                </td>
                <td>
                  {promo.valid_from?.slice(0, 10) ?? "Now"} –{" "}
                  {promo.valid_until?.slice(0, 10) ?? "No expiry"}
                </td>
                <td>
                  <Button
                    onClick={() =>
                      void save({
                        action: "toggle",
                        id: promo.id,
                        is_active: !promo.is_active,
                      })
                    }
                    size="sm"
                    variant={promo.is_active ? "default" : "outline"}
                  >
                    {promo.is_active ? "Active" : "Inactive"}
                  </Button>
                </td>
                <td>
                  {promo.max_uses
                    ? Math.round((promo.uses_count / promo.max_uses) * 100)
                    : promo.uses_count}{" "}
                  {promo.max_uses ? "%" : "uses"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
