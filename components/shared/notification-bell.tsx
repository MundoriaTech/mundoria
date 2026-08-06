"use client";

import { Bell, CheckCheck, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/customer";

export function NotificationBell({
  initialNotifications,
  userId,
}: {
  initialNotifications?: Notification[];
  userId: string;
}) {
  const [notifications, setNotifications] = useState(
    initialNotifications ?? [],
  );
  const pathname = usePathname();
  const [loading, setLoading] = useState(!initialNotifications);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const [isDesktop, setIsDesktop] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialNotifications) return;
    const supabase = createBrowserClient();
    void supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setNotifications((data as Notification[] | null) ?? []);
        setLoading(false);
      });
  }, [initialNotifications, userId]);

  useEffect(() => {
    const supabase = createBrowserClient();
    const channel = supabase
      .channel(`notifications-${userId}`)
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
            setNotifications((current) =>
              [payload.new as Notification, ...current].slice(0, 10),
            );
          } else if (payload.eventType === "UPDATE") {
            setNotifications((current) =>
              current.map((notification) =>
                notification.id === payload.new.id
                  ? (payload.new as Notification)
                  : notification,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setNotifications((current) =>
              current.filter(
                (notification) => notification.id !== payload.old.id,
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
          width: "min(22rem, calc(100vw - 1rem))",
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

  async function markRead(notification: Notification) {
    if (notification.is_read) return;
    await createBrowserClient()
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notification.id)
      .eq("user_id", userId);
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, is_read: true } : item,
      ),
    );
  }

  async function markAllRead() {
    await createBrowserClient()
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, is_read: true })),
    );
  }

  function notificationHref(notification: Notification) {
    const bookingId =
      typeof notification.data.booking_id === "string"
        ? notification.data.booking_id
        : null;
    if (typeof notification.data.href === "string") return notification.data.href;
    if (!bookingId) return null;
    if (pathname.startsWith("/admin")) return `/admin/booking/${bookingId}`;
    if (pathname.startsWith("/cleaner")) return `/cleaner/job/${bookingId}`;
    return `/booking/${bookingId}`;
  }

  let list: ReactNode;
  if (loading) {
    list = (
      <div className="flex justify-center p-8">
        <LoadingSpinner label="Loading notifications" />
      </div>
    );
  } else if (notifications.length) {
    list = notifications.map((notification) => {
      const href = notificationHref(notification);
      const content = (
        <div
          className={cn(
            "border-b border-border px-4 py-3.5 last:border-0",
            !notification.is_read && "bg-primary/10",
          )}
        >
          <p className="text-sm font-medium text-foreground">
            {notification.title}
          </p>
          <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">
            {notification.body}
          </p>
          <time className="mt-2 block text-[10px] text-muted-foreground">
            {new Date(notification.created_at).toLocaleString("en-GB", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </time>
        </div>
      );
      return href ? (
        <Link
          className="block min-h-11"
          href={href}
          key={notification.id}
          onClick={() => {
            void markRead(notification);
            setOpen(false);
          }}
        >
          {content}
        </Link>
      ) : (
        <button
          className="block min-h-11 w-full text-left"
          key={notification.id}
          onClick={() => void markRead(notification)}
          type="button"
        >
          {content}
        </button>
      );
    });
  } else {
    list = (
      <EmptyState
        className="m-4 border-0 p-5"
        message="You’re all caught up."
        title="No notifications"
      />
    );
  }

  const panel =
    open && mounted
      ? createPortal(
          <>
            <button
              aria-label="Close notifications"
              className="fixed inset-0 z-[110] bg-slate-950/45"
              onClick={() => setOpen(false)}
              type="button"
            />
            <div
              aria-label="Notifications"
              className={cn(
                "fixed z-[120] flex flex-col overflow-hidden border border-border bg-background shadow-2xl",
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
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
                <p className="font-semibold text-foreground">Notifications</p>
                <div className="flex items-center gap-1">
                  {unreadCount ? (
                    <button
                      className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-xs font-medium text-primary"
                      onClick={() => void markAllRead()}
                      type="button"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all read
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
                {list}
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
        aria-haspopup="dialog"
        aria-label="Notifications"
        className="relative h-11 w-11"
        onClick={() => setOpen((value) => !value)}
        ref={triggerRef}
        size="icon"
        type="button"
        variant="ghost"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </Button>
      {panel}
    </>
  );
}
