import { CleanerSignupFlow } from "@/components/auth/cleaner-signup-flow";
import { getMarketingViewer } from "@/components/marketing/marketing-shell";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata = {
  title: "Create cleaner account",
};

export default async function CleanerSignupPage() {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";
  const viewer = await getMarketingViewer();

  return <CleanerSignupFlow bookingHref={bookingHref} viewer={viewer} />;
}
