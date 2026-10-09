import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

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
  };
}) {
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
        initialMessage={searchParams.message}
        redirectTo={searchParams.redirectTo ?? "/cleaner/dashboard"}
        requiredRole="cleaner"
      />
    </AuthShell>
  );
}
