"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      className="inline-flex h-10 items-center gap-2 rounded-full border border-white/30 px-4 text-sm font-semibold text-white transition hover:bg-white/10 print:hidden"
      onClick={() => window.print()}
      type="button"
    >
      <Printer aria-hidden className="h-4 w-4" />
      Print / save as PDF
    </button>
  );
}
