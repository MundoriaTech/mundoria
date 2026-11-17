import { CallbackLeadsTable } from "@/components/admin/callback-leads-table";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Callback leads" };

export default async function AdminCallbackLeadsPage() {
  const { data, error } = await createAdminClient()
    .from("callback_leads")
    .select(
      "id,first_name,last_name,phone,email,available_in_10_min,source,utm_source,utm_medium,utm_campaign,created_at",
    )
    .order("created_at", { ascending: false });

  const rows = (data ?? []).map((row) => ({
    available_in_10_min: Boolean(row.available_in_10_min),
    created_at: row.created_at as string,
    email: row.email as string,
    first_name: row.first_name as string,
    id: row.id as string,
    last_name: row.last_name as string,
    phone: row.phone as string,
    source: row.source as string,
    utm_campaign: (row.utm_campaign as string | null) ?? null,
    utm_medium: (row.utm_medium as string | null) ?? null,
    utm_source: (row.utm_source as string | null) ?? null,
  }));

  return (
    <div className="min-w-0">
      {error ? (
        <p className="text-sm text-[#9a3412]">
          Callback leads could not be loaded. Apply the latest database
          migration and refresh this page.
        </p>
      ) : (
        <CallbackLeadsTable rows={rows} />
      )}
    </div>
  );
}
