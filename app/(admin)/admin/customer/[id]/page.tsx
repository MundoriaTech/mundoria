import { notFound, redirect } from "next/navigation";

import {
  CustomerBookingsPanel,
  type AdminCustomerBookingRow,
} from "@/components/admin/customer-bookings-panel";
import { RemoveUserButton } from "@/components/admin/remove-user-button";
import {
  UserActivityTimeline,
  type UserActivityRow,
} from "@/components/admin/user-activity-timeline";
import {
  getHardDeleteEligibility,
  hardDeleteBlockMessage,
} from "@/lib/admin/delete-user";
import { formatMoney } from "@/lib/customer/services";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

export default async function AdminCustomerPage({
  params,
}: {
  params: { id: string };
}) {
  const session = createServerClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) redirect("/admin/login");

  const admin = createAdminClient();
  const [
    { data: profile },
    { data: bookings },
    { data: addresses },
    { data: activity },
    eligibility,
  ] = await Promise.all([
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
        .is("archived_at", null)
        .order("is_default", { ascending: false }),
      admin
        .from("user_activity_events")
        .select("id, event_name, path, metadata, created_at")
        .eq("user_id", params.id)
        .order("created_at", { ascending: false })
        .limit(100),
      getHardDeleteEligibility({
        actorAdminId: user.id,
        userId: params.id,
      }),
    ]);

  if (!profile) notFound();

  const jobs = bookings ?? [];
  const spent = jobs
    .filter((booking) => booking.payment_status === "released")
    .reduce((sum, booking) => sum + (booking.amount_total ?? 0), 0);

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      <div>
        <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">
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

      <UserActivityTimeline
        events={(activity ?? []) as UserActivityRow[]}
      />

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

      <CustomerBookingsPanel
        bookings={jobs as AdminCustomerBookingRow[]}
      />

      <RemoveUserButton
        allowed={eligibility.allowed}
        blockMessage={
          eligibility.blockReason
            ? hardDeleteBlockMessage(eligibility.blockReason)
            : null
        }
        fullName={profile.full_name}
        role="customer"
        userId={profile.id}
      />
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
