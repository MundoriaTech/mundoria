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
    <div className="pb-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c79c66]">
        Your cleans
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#1c133b] dark:text-foreground sm:text-3xl">
        Sessions
      </h1>
      <p className="mt-2 max-w-xl text-sm font-light leading-6 text-[#5a5470] dark:text-muted-foreground">
        Upcoming cleans, completed visits, and cancelled sessions.
      </p>
      <div className="mt-6">
        <BookingsList bookings={bookings} initialTab={tab} />
      </div>
    </div>
  );
}
