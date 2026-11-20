import { CrmPageView } from "@/components/analytics/crm-page-view";
import { ProfileForm } from "@/components/customer/profile-form";
import { createServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/auth";

export const metadata = { title: "Profile" };

export default async function CustomerProfilePage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  return (
    <div className="min-w-0">
      <CrmPageView customerId={user!.id} event="account_view" />
      <ProfileForm initialProfile={data as Profile} />
    </div>
  );
}
