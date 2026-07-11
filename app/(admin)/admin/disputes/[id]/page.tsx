import { notFound } from "next/navigation";

import { DisputeActions } from "@/components/admin/dispute-actions";
import { formatMoney, formatServiceName } from "@/lib/customer/services";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function DisputeDetailPage({ params }: { params: { id: string } }) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("disputes")
    .select("*,booking:bookings(*,customer:profiles!bookings_customer_id_fkey(full_name,email),cleaner:profiles!bookings_cleaner_id_fkey(full_name,email)),raised_by_profile:profiles!disputes_raised_by_fkey(full_name)")
    .eq("id", params.id)
    .single();
  if (!data) notFound();
  return <div className="space-y-6"><div><p className="text-sm capitalize text-primary">{data.type.replaceAll("_"," ")} dispute</p><h1 className="text-3xl font-semibold">Dispute review</h1></div><div className="grid gap-5 lg:grid-cols-[1fr_.6fr]"><section className="rounded-xl border bg-white p-5"><h2 className="font-semibold">Dispute information</h2><p className="mt-4">{data.description}</p><div className="mt-5 grid gap-2 text-sm sm:grid-cols-2"><p><b>Raised by:</b> {data.raised_by_profile?.full_name}</p><p><b>Status:</b> {data.status}</p><p><b>Booking:</b> {formatServiceName(data.booking.service_type)}</p><p><b>Amount:</b> {formatMoney(data.booking.amount_total)}</p><p><b>Customer:</b> {data.booking.customer?.full_name}</p><p><b>Cleaner:</b> {data.booking.cleaner?.full_name}</p></div><div className="mt-5 flex flex-wrap gap-2">{(data.evidence_urls ?? []).map((url:string)=><a className="rounded-md border px-3 py-2 text-sm text-primary" href={url} key={url} target="_blank">View evidence</a>)}</div></section><DisputeActions disputeId={params.id}/></div></div>;
}
