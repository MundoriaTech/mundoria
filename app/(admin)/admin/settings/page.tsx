import { SettingsForm } from "@/components/admin/settings-form";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export default async function AdminSettingsPage() {
  const admin = createAdminClient();
  const { data: settings } = await admin
    .from("platform_settings")
    .select("*")
    .eq("id", true)
    .single();

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Fees, matching defaults, and other platform rules. Manage admin
          accounts on the{" "}
          <Link className="font-medium text-primary" href="/admin/team">
            Team
          </Link>{" "}
          page.
        </p>
      </div>
      <SettingsForm initial={settings} />
    </div>
  );
}
