import { MessageCircle } from "lucide-react";
import Link from "next/link";

import { createServerClient } from "@/lib/supabase/server";

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

  const cleanerIds = Array.from(
    new Set((bookings ?? []).map((booking) => booking.cleaner_id as string)),
  );
  const { data: cleaners } = cleanerIds.length
    ? await supabase
        .from("cleaner_public_profiles")
        .select("id, full_name")
        .in("id", cleanerIds)
    : { data: [] };
  const names = new Map(
    (cleaners ?? []).map((cleaner) => [cleaner.id, cleaner.full_name]),
  );

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Messages</h1>
      <p className="mt-2 text-muted-foreground">
        Keep booking details and updates in one place.
      </p>
      <div className="mt-8 space-y-3">
        {bookings?.length ? (
          bookings.map((booking) => (
            <Link
              className="flex items-center gap-4 rounded-xl border bg-background p-4 shadow-sm transition hover:border-primary"
              href={`/messages/${booking.id}`}
              key={booking.id}
            >
              <span className="rounded-full bg-emerald-100 p-3 text-primary">
                <MessageCircle className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold">
                  {names.get(booking.cleaner_id as string) ?? "Your cleaner"}
                </p>
                <p className="truncate text-sm capitalize text-muted-foreground">
                  {booking.service_type.replaceAll("_", " ")} ·{" "}
                  {booking.scheduled_date}
                </p>
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            Your cleaner conversations will appear here after matching.
          </div>
        )}
      </div>
    </div>
  );
}
