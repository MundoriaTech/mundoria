import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";
import { formatMoney } from "@/lib/customer/services";

export const metadata = { title: "Customers" };

export default async function AdminCustomersPage() {
  const admin = createAdminClient();
  const [{ data: profiles }, { data: bookings }] = await Promise.all([
    admin
      .from("profiles")
      .select("id,full_name,email,phone,created_at,referral_code")
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

  const customers = profiles ?? [];

  return (
    <div>
      <h1 className="text-3xl font-semibold">Customer management</h1>
      <p className="mb-7 mt-2 text-muted-foreground">
        Track customer accounts, booking activity, and spend. These are
        customers only — cleaners are managed separately.
      </p>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Customer</th>
              <th>Phone</th>
              <th>Bookings</th>
              <th>Completed</th>
              <th>Spend</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => {
              const summary = stats.get(customer.id) ?? {
                bookings: 0,
                completed: 0,
                spent: 0,
              };
              return (
                <tr className="border-t" key={customer.id}>
                  <td className="p-3">
                    <b>{customer.full_name}</b>
                    <small className="block text-muted-foreground">
                      {customer.email}
                    </small>
                  </td>
                  <td>{customer.phone || "—"}</td>
                  <td>{summary.bookings}</td>
                  <td>{summary.completed}</td>
                  <td>{formatMoney(summary.spent)}</td>
                  <td>
                    {new Date(customer.created_at).toLocaleDateString("en-GB")}
                  </td>
                  <td>
                    <Link
                      className="font-medium text-primary"
                      href={`/admin/customer/${customer.id}`}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
            {!customers.length ? (
              <tr>
                <td
                  className="p-8 text-center text-muted-foreground"
                  colSpan={7}
                >
                  No customer accounts yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
