import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata = {
  title: "Create customer account",
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
      description="Book trusted cleaners for your home or workplace."
      footer={
        <>
          Already have an account?{" "}
          <Link className="font-semibold text-[#291845] hover:underline" href={loginHref}>
            Sign in
          </Link>
          <span className="mt-2 block text-sm text-muted-foreground">
            Want to work as a cleaner?{" "}
            <Link className="font-semibold text-[#291845] hover:underline" href="/signup/cleaner">
              Create a cleaner account
            </Link>
          </span>
        </>
      }
      title="Create your customer account"
    >
      <SignupForm redirectTo={searchParams.redirectTo} role="customer" />
    </AuthShell>
  );
}
