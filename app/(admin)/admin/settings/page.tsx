import { SettingsForm } from "@/components/admin/settings-form";
import { AppPage } from "@/components/shared/app-page";
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
    <AppPage
      description={
        <>
          Fees, payment timing, matching defaults, and other platform rules.
          Manage admin accounts on the{" "}
          <Link className="font-semibold text-brand-purple" href="/admin/team">
            Team
          </Link>{" "}
          page.
        </>
      }
      eyebrow="Content"
      title="Settings"
    >
      <SettingsForm initial={settings} />
    </AppPage>
  );
}
