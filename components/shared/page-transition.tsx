"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Softens App Router page swaps with a short enter fade.
 * Exit of the previous page is still instant (Next replaces the tree);
 * the new page eases in so the cut feels less harsh.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="page-enter" key={pathname}>
      {children}
    </div>
  );
}
