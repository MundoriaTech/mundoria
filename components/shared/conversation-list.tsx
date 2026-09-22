import Link from "next/link";

import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils";

export type ConversationListItem = {
  bookingId: string;
  href: string;
  title: string;
  subtitle: string;
  preview: string;
  avatarUrl?: string | null;
  unread?: boolean;
  timeLabel?: string | null;
};

export function ConversationList({
  emptyBody,
  emptyTitle,
  items,
}: {
  emptyBody: string;
  emptyTitle: string;
  items: ConversationListItem[];
}) {
  if (!items.length) {
    return (
      <div className="mt-10 px-2 py-12 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c79c66]">
          Inbox
        </p>
        <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#1c133b] dark:text-foreground">
          {emptyTitle}
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm font-light leading-6 text-[#5a5470] dark:text-muted-foreground">
          {emptyBody}
        </p>
      </div>
    );
  }

  return (
    <ul className="mt-2">
      {items.map((item) => (
        <li key={item.bookingId}>
          <Link
            className="group flex items-center gap-3 border-b border-[#ece8f3] py-3.5 transition hover:bg-[#f7f4fc]/70 dark:border-border dark:hover:bg-muted/30 sm:gap-4 sm:py-4"
            href={item.href}
          >
            <UserAvatar
              className="h-11 w-11 shrink-0 border border-[#e8def8]"
              name={item.title}
              url={item.avatarUrl}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p
                  className={cn(
                    "truncate text-sm font-semibold text-[#1c133b] dark:text-foreground",
                    item.unread && "font-bold",
                  )}
                >
                  {item.title}
                </p>
                {item.timeLabel ? (
                  <span className="shrink-0 text-[11px] text-[#8b8798]">
                    {item.timeLabel}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 truncate text-xs text-[#8b8798]">
                {item.subtitle}
              </p>
              <p
                className={cn(
                  "mt-1 truncate text-sm text-[#5a5470] dark:text-muted-foreground",
                  item.unread && "font-medium text-[#1c133b] dark:text-foreground",
                )}
              >
                {item.preview}
              </p>
            </div>
            {item.unread ? (
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#d4694a]" />
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function messagePreviewLabel(message: {
  content?: string | null;
  attachments?: Array<{ type?: string }> | null;
}) {
  const attachments = message.attachments ?? [];
  const hasImage = attachments.some((item) => item.type === "image");
  const hasVideo = attachments.some((item) => item.type === "video");
  const text = message.content?.trim() ?? "";
  if (text) return text;
  if (hasVideo && hasImage) return "Sent media";
  if (hasVideo) return "Sent a video";
  if (hasImage) return "Sent a photo";
  if (attachments.length) return "Sent an attachment";
  return "No messages yet";
}

export function formatConversationTime(iso: string | null | undefined) {
  if (!iso) return null;
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}
