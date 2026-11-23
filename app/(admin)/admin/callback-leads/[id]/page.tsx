import { notFound } from "next/navigation";

import { AdminBackLink } from "@/components/admin/admin-back-link";
import { CallbackLeadDesk } from "@/components/admin/callback-lead-desk";
import { mapCallbackLeadRow } from "@/lib/admin/callback-desk";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Callback lead" };

export default async function AdminCallbackLeadPage({
  params,
}: {
  params: { id: string };
}) {
  const { data, error } = await createAdminClient()
    .from("callback_leads")
    .select(
      "id,first_name,last_name,phone,email,available_in_10_min,source,utm_source,utm_medium,utm_campaign,created_at,call_status,outcome,area,town,notes",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (error || !data) notFound();
  const row = mapCallbackLeadRow(data as Record<string, unknown>);

  return (
    <div className="min-w-0 space-y-4">
      <AdminBackLink href="/admin/callback-leads" label="callback leads" />
      <CallbackLeadDesk row={row} />
    </div>
  );
}
