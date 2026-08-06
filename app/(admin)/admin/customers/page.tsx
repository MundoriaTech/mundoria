import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";
import { formatMoney } from "@/lib/customer/services";

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

  const customers = profiles ?? [];

  return (
    <div className="min-w-0">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Customers
      </h1>
      <p className="mb-6 mt-2 text-sm text-muted-foreground sm:mb-7 sm:text-base">
        Customer accounts and spend. Cleaners are managed separately.
      </p>

      <div className="space-y-3 md:hidden">
        {customers.map((customer) => {
          const summary = stats.get(customer.id) ?? {
            bookings: 0,
            completed: 0,
            spent: 0,
          };
          return (
            <Link
              className="block rounded-xl border border-border bg-card p-4 transition active:bg-muted/40"
              href={`/admin/customer/${customer.id}`}
              key={customer.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{customer.full_name}</p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {customer.email}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {summary.bookings} bookings · {formatMoney(summary.spent)}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-medium text-primary">
                  View
                </span>
              </div>
            </Link>
          );
        })}
        {!customers.length ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No customer accounts yet.
          </p>
        ) : null}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
        <table className="w-full min-w-[720px] text-sm">
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
