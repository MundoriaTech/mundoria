import { BookingsList } from "@/components/customer/bookings-list";
import { getCustomerBookings } from "@/lib/customer/server";
import { createServerClient } from "@/lib/supabase/server";

export const metadata = { title: "My bookings" };

export default async function CustomerBookingsPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const bookings = await getCustomerBookings(supabase, user!.id);
  const tab =
    searchParams.tab === "past" || searchParams.tab === "cancelled"
      ? searchParams.tab
      : "upcoming";

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Your sessions</h1>
      <p className="mt-2 text-muted-foreground">
        Upcoming cleans, completed visits, and cancelled sessions.
      </p>
      <div className="mt-8">
        <BookingsList bookings={bookings} initialTab={tab} />
      </div>
    </div>
  );
}
