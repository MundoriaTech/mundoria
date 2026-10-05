"use client";

import { useEffect, useState, type ReactNode } from "react";

import { createBrowserClient } from "@/lib/supabase/client";

/** Keeps children in the server HTML, then hides them for signed-in cleaners. */
export function HideForCleaners({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hideIfCleaner() {
      try {
        const supabase = createBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        if (!cancelled && data?.role === "cleaner") setHidden(true);
      } catch {
        // Guests and failed lookups keep the public booking link.
      }
    }

    void hideIfCleaner();
    return () => {
      cancelled = true;
    };
  }, []);

  if (hidden) return null;
  return children;
}
