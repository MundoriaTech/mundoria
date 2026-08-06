"use client";

import { Button } from "@/components/ui/button";

export function PrintReceiptButton() {
  return (
    <Button onClick={() => window.print()} type="button">
      Print / save PDF
    </Button>
  );
}
