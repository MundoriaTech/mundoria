import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { META_OFFER_SOURCE } from "@/lib/bookings/percent-offer";
import { requireAdminArea } from "@/lib/admin/page-access";
import { CallbackLeadsTable } from "@/components/admin/callback-leads-table";
import { mapCallbackLeadRow } from "@/lib/admin/callback-desk";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Callback leads" };

const COLUMNS =
  "id,first_name,last_name,phone,email,available_in_10_min,source,utm_source,utm_medium,utm_campaign,created_at,call_status,outcome,area,town,notes";

export default async function AdminCallbackLeadsPage() {
  await requireAdminArea("callback_leads");
  const { data, error } = await fetchAllRows((from, to) =>
    createAdminClient()
    .from("callback_leads")
    .select(COLUMNS)
    // 20%-off (Meta) leads have their own section.
    .neq("source", META_OFFER_SOURCE)
    .order("created_at", { ascending: false })
      .range(from, to),
  );

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
