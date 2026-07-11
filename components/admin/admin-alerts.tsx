"use client";

import { Bell, CheckCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@/lib/supabase/client";
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
            setItems((current) => [payload.new as Notification, ...current].slice(0, 15));
          } else if (payload.eventType === "UPDATE") {
            setItems((current) =>
              current.map((item) =>
                item.id === payload.new.id ? (payload.new as Notification) : item,
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

  async function markAll() {
    await createBrowserClient()
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    setItems((current) => current.map((item) => ({ ...item, is_read: true })));
  }

  return (
    <div className="relative">
      <Button onClick={() => setOpen(!open)} size="icon" variant="ghost">
        <Bell className="h-5 w-5" />
        {unread ? (
          <span className="absolute right-0 top-0 rounded-full bg-red-600 px-1.5 text-[10px] text-white">
            {unread}
          </span>
        ) : null}
      </Button>
      {open ? (
        <div className="absolute right-0 top-12 w-[min(24rem,calc(100vw-2rem))] rounded-xl border bg-white shadow-xl">
          <div className="flex justify-between border-b p-4">
            <b>Admin alerts</b>
            <button className="text-xs text-primary" onClick={() => void markAll()}>
              <CheckCheck className="mr-1 inline h-3 w-3" /> Mark read
            </button>
          </div>
          <div className="max-h-96 overflow-auto">
            {items.map((item) => (
              <div
                className={`border-b p-4 text-sm ${item.is_read ? "" : "bg-amber-50"}`}
                key={item.id}
              >
                <b>{item.title}</b>
                <p className="mt-1 text-xs text-muted-foreground">{item.body}</p>
              </div>
            ))}
            {!items.length ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                No alerts.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
