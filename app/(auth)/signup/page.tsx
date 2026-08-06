import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata = {
  title: "Create account",
};

interface SignupPageProps {
  searchParams: {
    redirectTo?: string;
  };
}

export default function SignupPage({ searchParams }: SignupPageProps) {
  const loginHref = searchParams.redirectTo
    ? `/login?redirectTo=${encodeURIComponent(searchParams.redirectTo)}`
    : "/login";

  return (
    <AuthShell
      description="Join as a customer or independent cleaning professional."
      footer={
        <>
          Already have an account?{" "}
          <Link className="font-medium text-primary hover:underline" href={loginHref}>
            Sign in
          </Link>
        </>
      }
      title="Create your account"
    >
      <SignupForm redirectTo={searchParams.redirectTo} />
    </AuthShell>
  );
}
