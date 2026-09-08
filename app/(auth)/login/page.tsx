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
          ? "Looks like you already have a CleanScape account. Sign in to finish your booking."
          : "Welcome back. Your next booking or job is waiting."
      }
      footer={
        <>
          New to CleanScape?{" "}
          <Link
            className="font-semibold text-[#291845] hover:underline"
            href={signupHref}
          >
            Create an account
          </Link>
        </>
      }
      title="Sign in"
    >
      <LoginForm
        initialEmail={searchParams.email}
        initialError={searchParams.error}
        initialMessage={searchParams.message}
        redirectTo={searchParams.redirectTo}
      />
    </AuthShell>
  );
}
