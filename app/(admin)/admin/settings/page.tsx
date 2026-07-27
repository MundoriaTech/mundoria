import {
  AdminInvitationsManager,
  type AdminInvitationRow,
} from "@/components/admin/admin-invitations-manager";
import { SettingsForm } from "@/components/admin/settings-form";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminSettingsPage() {
  const admin = createAdminClient();
  const [{ data: settings }, { data: invitations }] = await Promise.all([
    admin.from("platform_settings").select("*").eq("id", true).single(),
    admin
      .from("admin_invitations")
      .select(
        "id,email,full_name,status,expires_at,created_at,accepted_at,revoked_at,invited_by_profile:profiles!admin_invitations_invited_by_fkey(full_name)",
      )
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-3xl font-semibold">Platform settings</h1>
        <p className="mt-2 text-muted-foreground">
          Configure operational defaults and secure administrator access.
        </p>
      </div>
      <SettingsForm initial={settings} />
      <AdminInvitationsManager
        initialInvitations={(invitations ?? []).map((invitation) => ({
          ...invitation,
          invited_by_profile: Array.isArray(invitation.invited_by_profile)
            ? invitation.invited_by_profile[0] ?? null
            : invitation.invited_by_profile,
        })) as AdminInvitationRow[]}
      />
    </div>
  );
}
