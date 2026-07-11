import { SettingsForm } from "@/components/admin/settings-form";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminSettingsPage() {
  const { data } = await createAdminClient()
    .from("platform_settings")
    .select("*")
    .eq("id", true)
    .single();
  return <div><h1 className="text-3xl font-semibold">Platform settings</h1><p className="mt-2 mb-7 text-muted-foreground">Configure operational defaults used across CleanScape.</p><SettingsForm initial={data} /></div>;
}
