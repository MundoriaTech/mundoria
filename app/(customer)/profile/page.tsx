import { ProfileForm } from "@/components/customer/profile-form";
import { AppPage } from "@/components/shared/app-page";
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
    <AppPage
      description="Keep your details, preferences, and payment methods up to date."
      eyebrow="Account"
      title="Your profile"
    >
      <ProfileForm initialProfile={data as Profile} />
    </AppPage>
  );
}
