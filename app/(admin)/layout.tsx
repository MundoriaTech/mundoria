import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { adminAccessFor } from "@/lib/admin/access";
import { buildPrivateMetadata } from "@/lib/seo/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/auth";
import type { Notification } from "@/types/customer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = buildPrivateMetadata("Admin");

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  noStore();
  const session = createServerClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) redirect("/admin/login");
  const admin = createAdminClient();
  const [{ data: profile }, { data: notifications }] = await Promise.all([
    admin.from("profiles").select("*").eq("id", user.id).single(),
    admin
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(15),
  ]);
  if (profile?.role !== "admin") redirect("/");
  const { data: assurance } = await session.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== "aal2") redirect("/admin/two-factor");
  const access = await adminAccessFor(profile.email as string | null);
  return (
    <AdminShell
      access={access}
      admin={profile as Profile}
      notifications={(notifications ?? []) as Notification[]}
    >
      {children}
    </AdminShell>
  );
}
