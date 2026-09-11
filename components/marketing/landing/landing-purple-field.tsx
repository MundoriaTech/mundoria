import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const LANDING_PURPLE = "#3F3562";

/** Shared solid purple band for hero + categories + popular. */
export function LandingPurpleField({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("relative isolate overflow-x-clip", className)}
      style={{ backgroundColor: LANDING_PURPLE }}
    >
      {children}
    </div>
  );
}
