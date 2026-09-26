import { CustomersTable } from "@/components/admin/customers-table";
import { AdminPageIntro } from "@/components/admin/admin-page-intro";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Customers" };

function formatAddressSummary(address: {
  address_line_1: string;
  city: string;
  postcode: string;
}) {
  return [address.address_line_1, address.city, address.postcode]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

export default async function AdminCustomersPage() {
  const admin = createAdminClient();
  const [{ data: profiles }, { data: bookings }, { data: addresses }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id,full_name,email,phone,created_at,referral_code,avatar_url")
        .eq("role", "customer")
        .order("created_at", { ascending: false }),
      admin
        .from("bookings")
        .select("customer_id,status,amount_total,payment_status"),
      admin
        .from("addresses")
        .select(
          "customer_id,address_line_1,city,postcode,is_default,created_at",
        )
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: true }),
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

  const primaryAddress = new Map<
    string,
    { label: string; extraCount: number }
  >();
  const addressCounts = new Map<string, number>();

  for (const address of addresses ?? []) {
    addressCounts.set(
      address.customer_id,
      (addressCounts.get(address.customer_id) ?? 0) + 1,
    );
    if (!primaryAddress.has(address.customer_id)) {
      primaryAddress.set(address.customer_id, {
        extraCount: 0,
        label: formatAddressSummary(address),
      });
    }
  }

  for (const [customerId, entry] of primaryAddress) {
    entry.extraCount = Math.max(0, (addressCounts.get(customerId) ?? 1) - 1);
  }

  const customers = (profiles ?? []).map((customer) => {
    const address = primaryAddress.get(customer.id);
    return {
      ...customer,
      addressLabel: address?.label ?? null,
      extraAddressCount: address?.extraCount ?? 0,
      stats: stats.get(customer.id) ?? {
        bookings: 0,
        completed: 0,
        spent: 0,
      },
    };
  });

  return (
    <div className="min-w-0">
      <AdminPageIntro>
        Customer accounts and spend. Cleaners are managed separately.
      </AdminPageIntro>
      <CustomersTable customers={customers} />
    </div>
  );
}
