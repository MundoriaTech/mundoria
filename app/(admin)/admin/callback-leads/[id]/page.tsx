import { redirect } from "next/navigation";
import { isMetaOfferSource } from "@/lib/bookings/percent-offer";
import { requireAdminArea } from "@/lib/admin/page-access";
import { notFound } from "next/navigation";

import { CallbackLeadDesk } from "@/components/admin/callback-lead-desk";
import { mapCallbackLeadRow } from "@/lib/admin/callback-desk";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Callback lead" };

export default async function AdminCallbackLeadPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdminArea("callback_leads");
  const { data, error } = await createAdminClient()
    .from("callback_leads")
    .select(
      "id,first_name,last_name,phone,email,available_in_10_min,source,utm_source,utm_medium,utm_campaign,created_at,call_status,outcome,area,town,notes,notes_updated_at,notes_editor:profiles!callback_leads_notes_updated_by_fkey(full_name)",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (error || !data) notFound();
  if (isMetaOfferSource(data.source as string)) redirect(`/admin/meta-leads/${params.id}`);
  const row = mapCallbackLeadRow(data as Record<string, unknown>);

  return (
    <div className="min-w-0 space-y-4">
      {/* The admin shell already shows "Back to callback leads" here. */}
      <CallbackLeadDesk row={row} />
    </div>
  );
}
