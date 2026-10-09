import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Log in",
};

interface LoginPageProps {
  searchParams: {
    email?: string;
    error?: string;
    message?: string;
    redirectTo?: string;
  };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const signupHref = searchParams.redirectTo
    ? `/signup?redirectTo=${encodeURIComponent(searchParams.redirectTo)}`
    : "/signup";
  const returningFromBooking =
    searchParams.redirectTo?.startsWith("/booking") &&
    Boolean(searchParams.email);

  return (
    <AuthShell
      description={
        returningFromBooking
          ? "Looks like you already have a Mundoria customer account. Sign in to finish your booking."
          : "Welcome back. Sign in to book and manage your cleans."
      }
      footer={
        <>
          New to Mundoria?{" "}
          <Link
            className="font-semibold text-[#291845] hover:underline"
            href={signupHref}
          >
            Create a customer account
          </Link>
          <span className="mt-2 block text-sm text-muted-foreground">
            Are you a cleaner?{" "}
            <Link className="font-semibold text-[#291845] hover:underline" href="/login/cleaner">
              Cleaner sign in
            </Link>
          </span>
        </>
      }
      title="Customer sign in"
    >
      <LoginForm
        initialEmail={searchParams.email}
        initialError={searchParams.error}
        initialMessage={searchParams.message}
        redirectTo={searchParams.redirectTo}
        requiredRole="customer"
      />
    </AuthShell>
  );
}
