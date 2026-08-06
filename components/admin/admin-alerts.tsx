"use client";

import { Bell, CheckCheck, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";

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
  const [mounted, setMounted] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const [isDesktop, setIsDesktop] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const unread = items.filter((item) => !item.is_read).length;

  useEffect(() => {
    setMounted(true);
  }, []);

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

    function layoutPanel() {
      const desktop = window.matchMedia("(min-width: 640px)").matches;
      setIsDesktop(desktop);
      const rect = triggerRef.current?.getBoundingClientRect();

      if (desktop && rect) {
        setPanelStyle({
          top: rect.bottom + 8,
          right: Math.max(8, window.innerWidth - rect.right),
          left: "auto",
          bottom: "auto",
          width: "min(24rem, calc(100vw - 1rem))",
          maxHeight: "min(24rem, 70vh)",
        });
        return;
      }

      setPanelStyle({
        top: "auto",
        right: 0,
        left: 0,
        bottom: 0,
        width: "100%",
        maxHeight: "min(88dvh, 40rem)",
      });
    }

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    layoutPanel();
    window.addEventListener("resize", layoutPanel);
    window.addEventListener("scroll", layoutPanel, true);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("resize", layoutPanel);
      window.removeEventListener("scroll", layoutPanel, true);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
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

  const panel =
    open && mounted
      ? createPortal(
          <>
            <button
              aria-label="Close alerts"
              className="fixed inset-0 z-[110] bg-slate-950/45"
              onClick={() => setOpen(false)}
              type="button"
            />
            <div
              className={cn(
                "fixed z-[120] flex flex-col overflow-hidden border border-border bg-card shadow-2xl",
                isDesktop
                  ? "rounded-xl"
                  : "rounded-t-2xl pb-[env(safe-area-inset-bottom)]",
              )}
              ref={panelRef}
              role="dialog"
              style={panelStyle}
            >
              {!isDesktop ? (
                <div className="flex shrink-0 items-center justify-center py-2">
                  <span className="h-1 w-10 rounded-full bg-muted-foreground/30" />
                </div>
              ) : null}
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border p-4">
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
                  {!isDesktop ? (
                    <button
                      aria-label="Close"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                      onClick={() => setOpen(false)}
                      type="button"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  ) : null}
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
          </>,
          document.body,
        )
      : null;

  return (
    <>
      <Button
        aria-expanded={open}
        aria-label="Admin alerts"
        className="relative h-11 w-11"
        onClick={() => setOpen(!open)}
        ref={triggerRef}
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
      {panel}
    </>
  );
}
