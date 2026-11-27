import { ConversationListView } from "@/components/shared/conversation-list-view";

import type { CleanerTier } from "@/types/cleaner";

export type ConversationListItem = {
  bookingId: string;
  href: string;
  title: string;
  subtitle: string;
  preview: string;
  avatarUrl?: string | null;
  /** When set, frames the avatar with the cleaner medallion ring. */
  medallionTier?: CleanerTier | null;
  seed?: string | null;
  unread?: boolean;
  timeLabel?: string | null;
};

export function ConversationList(props: {
  emptyBody: string;
  emptyTitle: string;
  items: ConversationListItem[];
}) {
  return <ConversationListView {...props} />;
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
