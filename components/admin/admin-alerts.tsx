"use client";

import { Bell, CheckCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/customer";

export function AdminAlerts({
  initialNotifications,
  userId,
}: {
  initialNotifications: Notification[];
  userId: string;
}) {
  const [items, setItems] = useState(initialNotifications);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const unread = items.filter((item) => !item.is_read).length;

  useEffect(() => {
    const supabase = createBrowserClient();
    const channel = supabase
      .channel(`admin-alerts-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          filter: `user_id=eq.${userId}`,
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setItems((current) =>
              [payload.new as Notification, ...current].slice(0, 15),
            );
          } else if (payload.eventType === "UPDATE") {
            setItems((current) =>
              current.map((item) =>
                item.id === payload.new.id
                  ? (payload.new as Notification)
                  : item,
              ),
            );
          }
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    if (!open) return;

    function close(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);

    const mobile = window.matchMedia("(max-width: 639px)").matches;
    const previousOverflow = document.body.style.overflow;
    if (mobile) document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
      if (mobile) document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  async function markAll() {
    await createBrowserClient()
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    setItems((current) => current.map((item) => ({ ...item, is_read: true })));
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button
        aria-expanded={open}
        aria-label="Admin alerts"
        className="h-11 w-11"
        onClick={() => setOpen(!open)}
        size="icon"
        variant="ghost"
      >
        <Bell className="h-5 w-5" />
        {unread ? (
          <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </Button>
      {open ? (
        <>
          <button
            aria-label="Close alerts"
            className="fixed inset-0 z-40 bg-slate-950/40 sm:hidden"
            onClick={() => setOpen(false)}
            type="button"
          />
          <div
            className={cn(
              "z-50 flex flex-col overflow-hidden border border-border bg-card shadow-xl",
              "fixed inset-x-0 bottom-0 max-h-[min(85dvh,36rem)] rounded-t-2xl pb-[env(safe-area-inset-bottom)]",
              "sm:absolute sm:inset-auto sm:right-0 sm:top-12 sm:max-h-96 sm:w-[min(24rem,calc(100vw-2rem))] sm:rounded-xl sm:pb-0",
            )}
            role="dialog"
          >
            <div className="flex shrink-0 items-center justify-center py-2 sm:hidden">
              <span className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>
            <div className="flex items-center justify-between gap-2 border-b border-border p-4">
              <b className="text-foreground">Admin alerts</b>
              <div className="flex items-center gap-1">
                {unread ? (
                  <button
                    className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-xs font-medium text-primary"
                    onClick={() => void markAll()}
                    type="button"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark read
                  </button>
                ) : null}
                <button
                  aria-label="Close"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted sm:hidden"
                  onClick={() => setOpen(false)}
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {items.map((item) => (
                <div
                  className={cn(
                    "border-b border-border p-4 text-sm last:border-0",
                    !item.is_read && "bg-primary/10",
                  )}
                  key={item.id}
                >
                  <b className="text-foreground">{item.title}</b>
                  <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              ))}
              {!items.length ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  No alerts.
                </p>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
