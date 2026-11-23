import { CallbackLeadsTable } from "@/components/admin/callback-leads-table";
import { mapCallbackLeadRow } from "@/lib/admin/callback-desk";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Callback leads" };

const COLUMNS =
  "id,first_name,last_name,phone,email,available_in_10_min,source,utm_source,utm_medium,utm_campaign,created_at,call_status,outcome,area,town,notes";

export default async function AdminCallbackLeadsPage() {
  const { data, error } = await createAdminClient()
    .from("callback_leads")
    .select(COLUMNS)
    .order("created_at", { ascending: false });

  return (
    <div className="min-w-0">
      {error ? (
        <p className="text-sm text-[#9a3412]">
          Callback leads could not be loaded. Apply the latest database
          migration and refresh this page.
        </p>
      ) : (
        <CallbackLeadsTable
          rows={(data ?? []).map((row) =>
            mapCallbackLeadRow(row as Record<string, unknown>),
          )}
        />
      )}
    </div>
  );
}
