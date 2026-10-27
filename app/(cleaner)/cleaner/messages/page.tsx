import {
  ConversationList,
  formatConversationTime,
  messagePreviewLabel,
} from "@/components/shared/conversation-list";
import { AppPage } from "@/components/shared/app-page";
import { getCleanerJobs } from "@/lib/cleaner/server";
import { formatServiceName } from "@/lib/customer/services";
import { createServerClient } from "@/lib/supabase/server";
import type { MessageAttachment } from "@/types/customer";

export const metadata = { title: "Messages" };

export default async function CleanerMessagesListPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const jobs = await getCleanerJobs(user!.id);
  const conversations = jobs.filter(
    (job) =>
      Boolean(job.customer_id) &&
      !["pending_match", "cancelled"].includes(job.status),
  );
  const bookingIds = conversations.map((job) => job.id);

  const { data: messages } = bookingIds.length
    ? await supabase
        .from("messages")
        .select("booking_id, content, attachments, created_at, is_read, receiver_id")
        .in("booking_id", bookingIds)
        .order("created_at", { ascending: false })
    : { data: [] as Array<{
        booking_id: string;
        content: string;
        attachments: MessageAttachment[] | null;
        created_at: string;
        is_read: boolean;
        receiver_id: string;
      }> };

  const latestByBooking = new Map<
    string,
    {
      content: string;
      attachments: MessageAttachment[] | null;
      created_at: string;
      is_read: boolean;
      receiver_id: string;
    }
  >();
  const unreadByBooking = new Set<string>();
  for (const message of messages ?? []) {
    if (!latestByBooking.has(message.booking_id)) {
      latestByBooking.set(message.booking_id, message);
    }
    if (message.receiver_id === user!.id && !message.is_read) {
      unreadByBooking.add(message.booking_id);
    }
  }

  const items = conversations
    .map((job) => {
      const latest = latestByBooking.get(job.id);
      const customerName = job.customer?.full_name ?? "Customer";
      return {
        avatarUrl: job.customer?.avatar_url ?? null,
        bookingId: job.id,
        href: `/cleaner/messages/${job.id}`,
        preview: latest
          ? messagePreviewLabel(latest)
          : "Start the conversation",
        subtitle: `${formatServiceName(job.service_type)} · ${new Date(
          `${job.scheduled_date}T12:00:00`,
        ).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        })}`,
        timeLabel: formatConversationTime(latest?.created_at),
        title: customerName.split(" ")[0] ?? customerName,
        unread: unreadByBooking.has(job.id),
        sortAt: latest?.created_at ?? `${job.scheduled_date}T00:00:00`,
      };
    })
    .sort(
      (a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime(),
    );

  return (
    <AppPage
      description="Keep booking details and updates with your customers in one place."
      eyebrow="Inbox"
      title="Messages"
    >
      <ConversationList
        emptyBody="Customer conversations appear here after you’re matched to a job."
        emptyTitle="No conversations yet"
        items={items}
      />
    </AppPage>
  );
}
