import Link from "next/link";
import { notFound } from "next/navigation";

import { formatMoney, formatServiceName } from "@/lib/customer/services";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminCustomerPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = createAdminClient();
  const [{ data: profile }, { data: bookings }, { data: addresses }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("*")
        .eq("id", params.id)
        .eq("role", "customer")
        .maybeSingle(),
      admin
        .from("bookings")
        .select(
          "*,address:addresses(city,postcode),cleaner_profile:profiles!bookings_cleaner_id_fkey(full_name)",
        )
        .eq("customer_id", params.id)
        .order("created_at", { ascending: false }),
      admin
        .from("addresses")
        .select("*")
        .eq("customer_id", params.id)
        .order("is_default", { ascending: false }),
    ]);

  if (!profile) notFound();

  const jobs = bookings ?? [];
  const spent = jobs
    .filter((booking) => booking.payment_status === "released")
    .reduce((sum, booking) => sum + (booking.amount_total ?? 0), 0);

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      <div>
        <Link className="text-sm text-primary hover:underline" href="/admin/customers">
          ← Customers
        </Link>
        <h1 className="mt-3 break-words text-2xl font-semibold tracking-tight sm:text-3xl">
          {profile.full_name}
        </h1>
        <p className="break-all text-sm text-muted-foreground sm:text-base">
          {profile.email}
        </p>
        {profile.phone ? (
          <p className="text-sm text-muted-foreground">{profile.phone}</p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <Metric label="Bookings" value={String(jobs.length)} />
        <Metric
          label="Completed"
          value={String(jobs.filter((job) => job.status === "completed").length)}
        />
        <Metric label="Lifetime spend" value={formatMoney(spent)} />
      </div>

      <section className="rounded-xl border bg-card p-4 sm:p-5">
        <h2 className="font-semibold">Account</h2>
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <b>Joined:</b>{" "}
            {new Date(profile.created_at).toLocaleString("en-GB")}
          </p>
          <p>
            <b>Referral code:</b> {profile.referral_code || "—"}
          </p>
          <p className="break-all sm:col-span-2">
            <b>Stripe customer:</b> {profile.stripe_customer_id || "—"}
          </p>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4 sm:p-5">
        <h2 className="font-semibold">Saved addresses</h2>
        <div className="mt-4 space-y-3">
          {(addresses ?? []).map((address) => (
            <div className="rounded-lg border p-3 text-sm" key={address.id}>
              <p className="font-medium">
                {address.label || "Address"}
                {address.is_default ? " · Default" : ""}
              </p>
              <p className="text-muted-foreground">
                {address.address_line_1}
                {address.address_line_2 ? `, ${address.address_line_2}` : ""}
                , {address.city} {address.postcode}
              </p>
            </div>
          ))}
          {!addresses?.length ? (
            <p className="text-sm text-muted-foreground">No saved addresses.</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4 sm:p-5">
        <h2 className="font-semibold">Bookings</h2>
        <div className="mt-4 space-y-3 md:hidden">
          {jobs.map((booking) => (
            <Link
              className="block rounded-lg border p-3 transition active:bg-muted/40"
              href={`/admin/booking/${booking.id}`}
              key={booking.id}
            >
              <p className="font-medium">
                {formatServiceName(booking.service_type)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {booking.scheduled_date} ·{" "}
                {booking.status.replaceAll("_", " ")}
              </p>
              <p className="mt-1 text-sm font-semibold">
                {formatMoney(booking.amount_total)}
              </p>
            </Link>
          ))}
          {!jobs.length ? (
            <p className="text-sm text-muted-foreground">No bookings yet.</p>
          ) : null}
        </div>
        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Service</th>
                <th>Date</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Cleaner</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((booking) => (
                <tr className="border-t" key={booking.id}>
                  <td className="p-3">
                    {formatServiceName(booking.service_type)}
                  </td>
                  <td>
                    {booking.scheduled_date}{" "}
                    {booking.scheduled_start_time?.slice(0, 5)}
                  </td>
                  <td className="capitalize">
                    {booking.status.replaceAll("_", " ")}
                  </td>
                  <td className="capitalize">{booking.payment_status}</td>
                  <td>{booking.cleaner_profile?.full_name ?? "—"}</td>
                  <td>{formatMoney(booking.amount_total)}</td>
                  <td>
                    <Link
                      className="text-primary hover:underline"
                      href={`/admin/booking/${booking.id}`}
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
              {!jobs.length ? (
                <tr>
                  <td
                    className="p-6 text-center text-muted-foreground"
                    colSpan={7}
                  >
                    No bookings yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold sm:text-2xl">{value}</p>
    </div>
  );
}
