import { notFound } from "next/navigation";

import { AdminBackLink } from "@/components/admin/admin-back-link";
import { CallbackLeadDesk } from "@/components/admin/callback-lead-desk";
import { mapCallbackLeadRow } from "@/lib/admin/callback-desk";
import { requireAdminArea } from "@/lib/admin/page-access";
import { META_OFFER_SOURCE } from "@/lib/bookings/percent-offer";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Meta 20% lead" };
export const dynamic = "force-dynamic";

export default async function AdminMetaLeadPage({ params }: { params: { id: string } }) {
  await requireAdminArea("meta_leads");
  const { data, error } = await createAdminClient()
    .from("callback_leads")
    .select(
      "id,first_name,last_name,phone,email,available_in_10_min,source,utm_source,utm_medium,utm_campaign,created_at,call_status,outcome,area,town,notes,notes_updated_at,notes_editor:profiles!callback_leads_notes_updated_by_fkey(full_name)",
    )
    .eq("id", params.id)
    .eq("source", META_OFFER_SOURCE)
    .maybeSingle();
  if (error || !data) notFound();
  return (
    <div className="min-w-0 space-y-4">
      <AdminBackLink href="/admin/meta-leads" label="Meta 20% leads" />
      <CallbackLeadDesk row={mapCallbackLeadRow(data as Record<string, unknown>)} />
    </div>
  );
}
