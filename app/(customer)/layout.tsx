import { redirect } from "next/navigation";

import { CustomerShell } from "@/components/customer/customer-shell";
import { createServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/auth";
import type { Notification } from "@/types/customer";

export const dynamic = "force-dynamic";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: notifications }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (!profile || profile.role !== "customer") {
    redirect(profile?.role === "cleaner" ? "/cleaner/dashboard" : "/");
  }

  return (
    <CustomerShell
      initialNotifications={(notifications ?? []) as Notification[]}
      profile={profile as Profile}
    >
      {children}
    </CustomerShell>
  );
}
