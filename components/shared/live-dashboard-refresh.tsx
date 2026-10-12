"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  DASHBOARD_REFRESH_MS,
  type LiveWatch,
} from "@/lib/dashboard/live-refresh";
import { createBrowserClient } from "@/lib/supabase/client";

const COALESCE_MS = 800;

export type { LiveWatch };

/**
 * Keeps a server-rendered dashboard current without reloading the page.
 * Refetches when the tab is visible again, on a quiet interval, and as soon
 * as a watched row changes.
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
  const watchKey = JSON.stringify(watches);

  useEffect(() => {
    const activeWatches = JSON.parse(watchKey) as LiveWatch[];
    let coalesceTimer = 0;
    let disposed = false;

    function refresh() {
      if (disposed || document.visibilityState === "hidden") return;
      router.refresh();
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

  return null;
}
