import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { SIGNUP_VERIFY_MESSAGE } from "@/lib/auth/signup-email-pending";

export const metadata = {
  title: "Cleaner sign in",
};

export default function CleanerLoginPage({
  searchParams,
}: {
  searchParams: {
    email?: string;
    error?: string;
    message?: string;
    redirectTo?: string;
    verify?: string;
  };
}) {
  if (searchParams.email) {
    const params = new URLSearchParams();
    if (searchParams.verify === "1") params.set("verify", "1");
    if (searchParams.redirectTo) params.set("redirectTo", searchParams.redirectTo);
    if (searchParams.message) params.set("message", searchParams.message);
    if (searchParams.error) params.set("error", searchParams.error);
    const query = params.toString();
    redirect(query ? `/login/cleaner?${query}` : "/login/cleaner");
  }

  return (
    <AuthShell
      description="Sign in to your cleaner account to see jobs, earnings, and your schedule."
      footer={
        <>
          New cleaner?{" "}
          <Link className="font-semibold text-[#291845] hover:underline" href="/signup/cleaner">
            Create a cleaner account
          </Link>
          <span className="mt-2 block text-sm text-muted-foreground">
            Booking a clean?{" "}
            <Link className="font-semibold text-[#291845] hover:underline" href="/login">
              Customer sign in
            </Link>
          </span>
        </>
      }
      title="Cleaner sign in"
    >
      <LoginForm
        initialEmail={searchParams.email}
        initialError={searchParams.error}
        initialMessage={
          searchParams.verify === "1"
            ? SIGNUP_VERIFY_MESSAGE
            : searchParams.message
        }
        redirectTo={searchParams.redirectTo ?? "/cleaner/dashboard"}
        requiredRole="cleaner"
      />
    </AuthShell>
  );
}
