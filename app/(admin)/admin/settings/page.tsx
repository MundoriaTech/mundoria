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
      <p className="max-w-2xl text-sm leading-6 text-[#5a5470] sm:text-base">
        Fees, matching defaults, and other platform rules. Manage admin accounts
        on the{" "}
        <Link className="font-semibold text-[#6a45b8]" href="/admin/team">
          Team
        </Link>{" "}
        page.
      </p>
      <SettingsForm initial={settings} />
    </div>
  );
}
