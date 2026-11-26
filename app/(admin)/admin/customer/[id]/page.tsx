import { notFound, redirect } from "next/navigation";

import {
  CustomerBookingsPanel,
  type AdminCustomerBookingRow,
} from "@/components/admin/customer-bookings-panel";
import { attributionLine } from "@/components/admin/callback-lead-context";
import { DetailSection } from "@/components/admin/detail-section";
import { RemoveUserButton } from "@/components/admin/remove-user-button";
import {
  UserActivityTimeline,
  type UserActivityRow,
} from "@/components/admin/user-activity-timeline";
import {
  getHardDeleteEligibility,
  hardDeleteBlockMessage,
} from "@/lib/admin/delete-user";
import { humanize, ukDateTime } from "@/lib/admin/format";
import { formatMoney } from "@/lib/customer/services";
import Link from "next/link";
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

  const email = String(profile.email ?? "").toLowerCase();
  const [{ data: authUser }, { data: referrer }, { data: lead }, { data: callbacks }, { data: drafts }] = await Promise.all([
    admin.auth.admin.getUserById(params.id),
    profile.referred_by
      ? admin.from("profiles").select("id,full_name").eq("id", profile.referred_by).maybeSingle()
      : Promise.resolve({ data: null }),
    admin
      .from("leads")
      .select("id,status,source,utm_source,utm_medium,utm_campaign,created_at")
      .or(`profile_id.eq.${params.id}${email ? `,email.eq.${email}` : ""}`)
      .limit(1)
      .maybeSingle(),
    email
      ? admin.from("callback_leads").select("id,source,created_at,call_status").eq("email", email).order("created_at", { ascending: false }).limit(10)
      : Promise.resolve({ data: [] as Array<{ call_status: string; created_at: string; id: string; source: string }> }),
    admin
      .from("booking_drafts")
      .select("id,completed_at,prepared_by,updated_at")
      .eq("user_id", params.id)
      .is("completed_at", null),
  ]);
  const meta = (authUser?.user?.user_metadata ?? {}) as Record<string, unknown>;
  const providers = (authUser?.user?.identities ?? []).map((identity) => identity.provider);
  const signupEvent = (activity ?? []).find((event) => event.event_name === "signed_up");
  const prefs = (profile.notification_preferences ?? {}) as Record<string, boolean>;

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

      <DetailSection
        rows={[
          { label: "Joined", value: ukDateTime(profile.created_at) },
          {
            label: "Signed up with",
            value: profile.created_by_admin
              ? "Account made by an admin"
              : providers.includes("google")
                ? "Google"
                : "Email and password",
          },
          {
            label: "Signed up from",
            value: signupEvent?.path === "/booking/new" ? "The booking flow" : signupEvent?.path ? signupEvent.path : null,
          },
          { label: "Email confirmed", value: authUser?.user?.email_confirmed_at ? ukDateTime(authUser.user.email_confirmed_at) : "Not yet" },
          {
            label: "Marketing emails at sign-up",
            value: typeof meta.marketing_opt_in === "boolean" ? (meta.marketing_opt_in ? "Opted in" : "Not opted in") : "Not asked",
          },
          {
            label: "Notifications",
            value: ["email", "sms", "push"]
              .map((key) => `${key === "sms" ? "Text" : humanize(key)}: ${prefs[key] === false ? "off" : "on"}`)
              .join(" · "),
          },
          { label: "Ad / first visit", value: attributionLine(meta.attribution as Record<string, unknown> | null) },
          { label: "Referral code typed at sign-up", value: typeof meta.referral_code_entered === "string" ? meta.referral_code_entered : null },
          {
            label: "Referred by",
            value: referrer ? (
              <Link className="text-[#524096] hover:underline" href={`/admin/customer/${referrer.id}`}>
                {referrer.full_name ?? "Customer"}
              </Link>
            ) : "No one",
          },
          { label: "Their share code (for referring others)", value: profile.referral_code || null },
          {
            label: "Lead record",
            value: lead ? (
              <Link className="text-[#524096] hover:underline" href={`/admin/leads/${lead.id}`}>
                {humanize(lead.status)} · first came from {[lead.source, lead.utm_source, lead.utm_medium, lead.utm_campaign].filter(Boolean).join(" / ")}
              </Link>
            ) : "None",
          },
          {
            label: "Callback requests",
            value: (callbacks ?? []).length
              ? (callbacks ?? []).map((row) => (
                  <span className="block" key={row.id}>
                    <Link className="text-[#524096] hover:underline" href={`/admin/callback-leads/${row.id}`}>
                      {ukDateTime(row.created_at)} · {row.source}
                    </Link>{" "}
                    ({humanize(row.call_status)})
                  </span>
                ))
              : "None",
          },
          {
            label: "Unfinished bookings",
            value: (drafts ?? []).length ? (
              <Link className="text-[#524096] hover:underline" href="/admin/abandoned-bookings">
                {(drafts ?? []).length} open draft{(drafts ?? []).length === 1 ? "" : "s"}
                {(drafts ?? []).some((draft) => draft.prepared_by) ? " (incl. one prepared by an admin)" : ""}
              </Link>
            ) : "None",
          },
          { label: "Stripe customer", value: profile.stripe_customer_id || null },
        ]}
        title="Account"
      />

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
              <p className="text-muted-foreground">
                {[
                  address.property_type ? humanize(address.property_type) : null,
                  address.num_bedrooms != null ? `${address.num_bedrooms} bed` : null,
                  address.num_bathrooms != null ? `${address.num_bathrooms} bath` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {address.special_requirements ? (
                <p className="mt-1 whitespace-pre-line">
                  <b>Access notes:</b> {address.special_requirements}
                </p>
              ) : null}
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
