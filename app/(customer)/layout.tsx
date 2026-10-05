import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CustomerShell } from "@/components/customer/customer-shell";
import { buildPrivateMetadata } from "@/lib/seo/site";
import { createServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPrivateMetadata("Account");

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "customer") {
    redirect(profile?.role === "cleaner" ? "/cleaner/dashboard" : "/");
  }

  return (
    <CustomerShell profile={profile as Profile}>
      {children}
    </CustomerShell>
  );
}
