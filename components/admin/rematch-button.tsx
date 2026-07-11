"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function RematchButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  async function rematch() {
    await fetch(`/api/admin/bookings/${bookingId}`, {
      body: JSON.stringify({
        action: "rematch",
        note: "One-click replacement requested from operations monitor",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    router.refresh();
  }
  return <Button onClick={() => void rematch()} size="sm" variant="destructive">Find Replacement</Button>;
}
