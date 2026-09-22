import {
  ConversationList,
  formatConversationTime,
  messagePreviewLabel,
} from "@/components/shared/conversation-list";
import { formatServiceName } from "@/lib/customer/services";
import { createServerClient } from "@/lib/supabase/server";
import type { MessageAttachment, ServiceType } from "@/types/customer";

export const metadata = { title: "Messages" };

export default async function CustomerConversationsPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, cleaner_id, service_type, scheduled_date")
    .eq("customer_id", user!.id)
    .not("cleaner_id", "is", null)
    .order("scheduled_date", { ascending: false });

  const bookingRows = bookings ?? [];
  const cleanerIds = Array.from(
    new Set(bookingRows.map((booking) => booking.cleaner_id as string)),
  );
  const bookingIds = bookingRows.map((booking) => booking.id);

  const [{ data: cleaners }, { data: messages }] = await Promise.all([
    cleanerIds.length
      ? supabase
          .from("cleaner_public_profiles")
          .select("id, full_name, avatar_url")
          .in("id", cleanerIds)
      : Promise.resolve({ data: [] as Array<{
          id: string;
          full_name: string;
          avatar_url: string | null;
        }> }),
    bookingIds.length
      ? supabase
          .from("messages")
          .select("booking_id, content, attachments, created_at, is_read, receiver_id")
          .in("booking_id", bookingIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as Array<{
          booking_id: string;
          content: string;
          attachments: MessageAttachment[] | null;
          created_at: string;
          is_read: boolean;
          receiver_id: string;
        }> }),
  ]);

  const cleanerById = new Map(
    (cleaners ?? []).map((cleaner) => [cleaner.id, cleaner]),
  );
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

  const items = bookingRows
    .map((booking) => {
      const cleaner = cleanerById.get(booking.cleaner_id as string);
      const latest = latestByBooking.get(booking.id);
      return {
        avatarUrl: cleaner?.avatar_url ?? null,
        bookingId: booking.id,
        href: `/messages/${booking.id}`,
        preview: latest
          ? messagePreviewLabel(latest)
          : "Say hello to your cleaner",
        subtitle: `${formatServiceName(booking.service_type as ServiceType)} · ${new Date(
          `${booking.scheduled_date}T12:00:00`,
        ).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        })}`,
        timeLabel: formatConversationTime(latest?.created_at),
        title: cleaner?.full_name?.split(" ")[0] ?? "Your cleaner",
        unread: unreadByBooking.has(booking.id),
        sortAt: latest?.created_at ?? `${booking.scheduled_date}T00:00:00`,
      };
    })
    .sort(
      (a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime(),
    );

  return (
    <div className="pb-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c79c66]">
        Inbox
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#1c133b] dark:text-foreground sm:text-3xl">
        Messages
      </h1>
      <p className="mt-2 max-w-xl text-sm font-light leading-6 text-[#5a5470] dark:text-muted-foreground">
        Chat with your cleaner about access, timing, and session details.
      </p>
      <ConversationList
        emptyBody="Conversations appear here once a cleaner is matched to your booking."
        emptyTitle="No conversations yet"
        items={items}
      />
    </div>
  );
}
