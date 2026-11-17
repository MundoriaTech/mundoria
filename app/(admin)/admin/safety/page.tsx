import {
  SafetyAlertsTable,
  type SafetyAlertRow,
} from "@/components/admin/safety-alerts-table";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminSafetyPage() {
  const { data } = await createAdminClient()
    .from("booking_safety_alerts")
    .select(
      "id,booking_id,status,reason,raised_by_role,created_at,address_line,acknowledged_at,raised_by_profile:profiles!booking_safety_alerts_raised_by_fkey(full_name)",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as SafetyAlertRow[];

  return (
    <div className="min-w-0">
      <SafetyAlertsTable rows={rows} />
    </div>
  );
}
