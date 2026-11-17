import Link from "next/link";

import { UserAvatar } from "@/components/shared/user-avatar";

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
      <div className="rounded-[14px] bg-[#F3F4F6] px-5 py-14 text-center">
        <div
          className="mx-auto mb-4 flex items-center justify-center rounded-full bg-[#EAE7F5]"
          style={{ width: "56px", height: "56px" }}
        >
          <svg fill="none" height={26} stroke="#524096" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} viewBox="0 0 24 24" width={26}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <p style={{ fontSize: "17.4px", fontWeight: 700, color: "#1E1848", margin: 0 }}>{emptyTitle}</p>
        <p style={{ fontSize: "14.5px", color: "#6B6B70", maxWidth: "320px", margin: "6px auto 0" }}>{emptyBody}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[6px]">
      {items.map((item) => (
        <Link
          className="flex items-center gap-4 rounded-[14px] bg-[#F3F4F6] p-4 transition-colors hover:bg-white hover:shadow-sm"
          href={item.href}
          key={item.bookingId}
          style={{ textDecoration: "none" }}
        >
          <div className="relative shrink-0">
            <UserAvatar
              className="h-12 w-12"
              name={item.title}
              url={item.avatarUrl}
            />
            {item.unread ? (
              <span
                className="absolute -right-0.5 -top-0.5 rounded-full bg-[#D4694A]"
                style={{ width: "10px", height: "10px", border: "2px solid #F3F4F6" }}
              />
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <span
                className="truncate"
                style={{ fontSize: "15px", fontWeight: item.unread ? 700 : 600, color: "#1E1848" }}
              >
                {item.title}
              </span>
              {item.timeLabel ? (
                <span style={{ fontSize: "12px", color: "#8B8798", flexShrink: 0 }}>{item.timeLabel}</span>
              ) : null}
            </div>
            <p className="truncate" style={{ fontSize: "12.5px", color: "#8B8798", margin: "1px 0 0" }}>
              {item.subtitle}
            </p>
            <p
              className="truncate"
              style={{
                fontSize: "13.5px",
                color: item.unread ? "#1E1848" : "#5F5F66",
                fontWeight: item.unread ? 600 : 400,
                margin: "3px 0 0",
              }}
            >
              {item.preview}
            </p>
          </div>

          <svg fill="none" height={18} stroke="#C4BFD4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" width={18}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
      ))}
    </div>
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
