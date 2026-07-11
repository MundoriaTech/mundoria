import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";

export async function requireAdmin() {
  const sessionClient = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    return null;
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return null;
  }

  return { admin, profile, user };
}

export async function logAdminAction({
  action,
  adminId,
  entityId,
  entityType,
  metadata,
  reason,
}: {
  action: string;
  adminId: string;
  entityId?: string | null;
  entityType: string;
  metadata?: Record<string, unknown>;
  reason?: string | null;
}) {
  return createAdminClient().from("admin_action_logs").insert({
    action,
    admin_id: adminId,
    entity_id: entityId ?? null,
    entity_type: entityType,
    metadata: metadata ?? {},
    reason: reason ?? null,
  });
}
