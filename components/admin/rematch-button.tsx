"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/lib/feedback/toast";

export function RematchButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function rematch() {
    setBusy(true);
    const response = await fetch(`/api/admin/bookings/${bookingId}`, {
      body: JSON.stringify({
        action: "rematch",
        note: "One-click replacement requested from operations monitor",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      toast.error("Couldn’t find a replacement", {
        action: { label: "Try again", onClick: () => void rematch() },
        description: result.error ?? "Rematch failed",
      });
      return;
    }
    toast.success("Looking for a replacement", {
      description: "The matching engine is searching again.",
    });
    router.refresh();
  }

  return (
    <Button
      loading={busy}
      loadingLabel="Matching…"
      onClick={() => void rematch()}
      size="sm"
      variant="destructive"
    >
      Find Replacement
    </Button>
  );
}
