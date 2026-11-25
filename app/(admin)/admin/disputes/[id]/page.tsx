import Link from "next/link";
import { notFound } from "next/navigation";

import { DetailSection } from "@/components/admin/detail-section";
import { DisputeActions } from "@/components/admin/dispute-actions";
import { humanize, ukDate, ukDateTime } from "@/lib/admin/format";
import { formatMoney, formatServiceName } from "@/lib/customer/services";
import { DISPUTE_OPTIONS, type DisputeOption } from "@/lib/disputes/options";
import { createAdminClient } from "@/lib/supabase/admin";

const linkClass = "font-medium text-[#524096] hover:underline";

/** Turn the stored option keys into the labels the customer actually tapped. */
function pathLabels(path: string[]) {
  const labels: string[] = [];
  let level: DisputeOption[] | undefined = DISPUTE_OPTIONS;
  for (const key of path) {
    const option: DisputeOption | undefined = level?.find((item) => item.key === key);
    labels.push(option?.label ?? humanize(key));
    level = option?.children;
  }
  return labels;
}

export default async function DisputeDetailPage({ params }: { params: { id: string } }) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("disputes")
    .select(
      "*,booking:bookings(*,customer:profiles!bookings_customer_id_fkey(id,full_name,email,phone),cleaner:profiles!bookings_cleaner_id_fkey(id,full_name,email,phone)),raised_by_profile:profiles!disputes_raised_by_fkey(id,full_name,role)",
    )
    .eq("id", params.id)
    .single();
  if (!data) notFound();

  const path = (data.category_path ?? []) as string[];
  const labels = pathLabels(path);
  const metadata = (data.structured_metadata ?? {}) as Record<string, unknown>;
  const selected = typeof metadata.selected_label === "string" ? metadata.selected_label : null;
  const raisedBy = data.raised_by_profile as { full_name: string | null; id: string; role: string | null } | null;
  const booking = data.booking;
  const evidence = (data.evidence_urls ?? []) as string[];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm capitalize text-primary">{String(data.type).replaceAll("_", " ")} dispute</p>
        <h1 className="text-3xl font-semibold">Dispute review</h1>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_.6fr]">
        <div className="space-y-5">
          <DetailSection
            rows={[
              { label: "What they chose", value: labels.length ? labels.join(" → ") : null, wide: true },
              { label: "Final option", value: selected },
              { label: "In their words", value: data.description, wide: true },
              { label: "Raised", value: ukDateTime(data.created_at) },
              {
                label: "Raised by",
                value: raisedBy ? (
                  <Link className={linkClass} href={raisedBy.role === "cleaner" ? `/admin/cleaners/${raisedBy.id}` : `/admin/customer/${raisedBy.id}`}>
                    {raisedBy.full_name ?? "User"} ({raisedBy.role ?? "user"})
                  </Link>
                ) : null,
              },
              { label: "Status", value: humanize(data.status) },
              { label: "About a rating", value: data.rating_id ? "Yes, the customer's rating of the clean" : "No" },
              {
                label: "Evidence",
                value: evidence.length
                  ? evidence.map((url, index) => (
                      <a className={`${linkClass} mr-3`} href={url} key={url} rel="noreferrer" target="_blank">
                        File {index + 1}
                      </a>
                    ))
                  : "None uploaded",
              },
            ]}
            title="Dispute information"
          />
          {booking ? (
            <DetailSection
              rows={[
                {
                  label: "Booking",
                  value: (
                    <Link className={linkClass} href={`/admin/booking/${booking.id}`}>
                      {formatServiceName(booking.service_type)} · {ukDate(booking.scheduled_date, true)}
                      {booking.scheduled_start_time ? ` at ${String(booking.scheduled_start_time).slice(0, 5)}` : ""}
                    </Link>
                  ),
                },
                { label: "Amount", value: formatMoney(booking.amount_total) },
                { label: "Booking status", value: humanize(booking.status) },
                { label: "Payment", value: humanize(booking.payment_status) },
                {
                  label: "Customer",
                  value: booking.customer ? (
                    <Link className={linkClass} href={`/admin/customer/${booking.customer.id}`}>
                      {booking.customer.full_name ?? "Customer"}
                    </Link>
                  ) : null,
                },
                {
                  label: "Cleaner",
                  value: booking.cleaner ? (
                    <Link className={linkClass} href={`/admin/cleaners/${booking.cleaner.id}`}>
                      {booking.cleaner.full_name ?? "Cleaner"}
                    </Link>
                  ) : "Unassigned",
                },
              ]}
              title="The booking"
            />
          ) : null}
        </div>
        <DisputeActions disputeId={params.id} />
      </div>
    </div>
  );
}
