"use client";

import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";

import {
  DASHBOARD_REFRESH_MS,
  type LiveWatch,
} from "@/lib/dashboard/live-refresh";
import { DURATION, EASE } from "@/lib/motion";
import { createBrowserClient } from "@/lib/supabase/client";

const COALESCE_MS = 800;

export type { LiveWatch };

/**
 * Keeps a server-rendered dashboard current without reloading the page.
 * Refetches when the tab is visible again, on a quiet interval, and as soon
 * as a watched row changes. While a refetch is in flight a small
 * "Updating" pill shows so data never swaps silently.
 */
export function LiveDashboardRefresh({
  intervalMs = DASHBOARD_REFRESH_MS,
  scope,
  watches = [],
}: {
  intervalMs?: number;
  scope: string;
  watches?: LiveWatch[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const watchKey = JSON.stringify(watches);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const activeWatches = JSON.parse(watchKey) as LiveWatch[];
    let coalesceTimer = 0;
    let disposed = false;

    function refresh() {
      if (disposed || document.visibilityState === "hidden") return;
      startTransition(() => {
        router.refresh();
      });
    }

    function schedule() {
      window.clearTimeout(coalesceTimer);
      coalesceTimer = window.setTimeout(refresh, COALESCE_MS);
    }

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, intervalMs);

    function onVisibility() {
      if (document.visibilityState === "visible") refresh();
    }
    document.addEventListener("visibilitychange", onVisibility);

    const supabase = createBrowserClient();
    const channelName = `live-dashboard-${scope}`;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    if (activeWatches.length) {
      for (const existing of supabase.getChannels()) {
        if (
          existing.topic === channelName ||
          existing.topic === `realtime:${channelName}`
        ) {
          void supabase.removeChannel(existing);
        }
      }

      channel = supabase.channel(channelName);
      for (const watch of activeWatches) {
        channel.on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: watch.table,
            ...(watch.filter ? { filter: watch.filter } : {}),
          },
          () => schedule(),
        );
      }
      channel.subscribe();
    }

    return () => {
      disposed = true;
      window.clearInterval(interval);
      window.clearTimeout(coalesceTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [intervalMs, router, scope, watchKey]);

  if (!mounted) return null;

  // Portaled so the pill never takes part in the page's flow or spacing.
  return createPortal(
    <AnimatePresence>
      {isPending ? (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          aria-live="polite"
          className="pointer-events-none fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-30 inline-flex items-center gap-2 rounded-full border border-brand-line bg-white/95 px-3 py-1.5 text-xs font-medium text-brand-muted shadow-[0_10px_24px_rgba(28,19,59,0.12)] backdrop-blur md:bottom-6 md:right-6"
          exit={{
            opacity: 0,
            transition: { duration: DURATION.fast, ease: EASE.in },
            y: 6,
          }}
          initial={{ opacity: 0, y: 10 }}
          key="live-refresh"
          role="status"
          transition={{ duration: DURATION.base, ease: EASE.out }}
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-purple" />
          Updating…
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
