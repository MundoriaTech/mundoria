"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ProcessPayoutsButton() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);
  async function process() {
    if (!window.confirm("Process all pending Stripe Connect transfers?")) return;
    setWorking(true);
    const response = await fetch("/api/admin/payouts/process", { method: "POST" });
    const result = (await response.json()) as {
      error?: string;
      results?: { status: string }[];
    };
    setWorking(false);
    setMessage(
      response.ok
        ? `${result.results?.filter((item) => item.status === "paid").length ?? 0} payouts processed.`
        : result.error ?? "Batch failed.",
    );
    if (response.ok) router.refresh();
  }
  return <div><Button disabled={working} onClick={() => void process()}>{working ? "Processing…" : "Process payouts"}</Button>{message ? <p className="mt-2 text-sm">{message}</p> : null}</div>;
}
