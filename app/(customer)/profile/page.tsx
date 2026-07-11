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
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Your profile</h1>
      <p className="mt-2 text-muted-foreground">
        Keep your details, preferences, and payment methods up to date.
      </p>
      <div className="mt-8">
        <ProfileForm initialProfile={data as Profile} />
      </div>
    </div>
  );
}
