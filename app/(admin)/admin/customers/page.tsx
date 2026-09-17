import { CustomersTable } from "@/components/admin/customers-table";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Customers" };

export default async function AdminCustomersPage() {
  const admin = createAdminClient();
  const [{ data: profiles }, { data: bookings }] = await Promise.all([
    admin
      .from("profiles")
      .select("id,full_name,email,phone,created_at,referral_code,avatar_url")
      .eq("role", "customer")
      .order("created_at", { ascending: false }),
    admin
      .from("bookings")
      .select("customer_id,status,amount_total,payment_status"),
  ]);

  const stats = new Map<
    string,
    { bookings: number; completed: number; spent: number }
  >();

  for (const booking of bookings ?? []) {
    const current = stats.get(booking.customer_id) ?? {
      bookings: 0,
      completed: 0,
      spent: 0,
    };
    current.bookings += 1;
    if (booking.status === "completed") current.completed += 1;
    if (booking.payment_status === "released") {
      current.spent += booking.amount_total ?? 0;
    }
    stats.set(booking.customer_id, current);
  }

  const customers = (profiles ?? []).map((customer) => ({
    ...customer,
    stats: stats.get(customer.id) ?? {
      bookings: 0,
      completed: 0,
      spent: 0,
    },
  }));

  return (
    <div className="min-w-0">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Customers
      </h1>
      <p className="mb-6 mt-2 text-sm text-muted-foreground sm:mb-7 sm:text-base">
        Customer accounts and spend. Cleaners are managed separately.
      </p>

      <CustomersTable customers={customers} />
    </div>
  );
}
