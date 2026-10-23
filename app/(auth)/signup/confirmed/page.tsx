import Image from "next/image";
import Link from "next/link";

import { safeInternalPath } from "@/components/auth/email-sent-panel";
import { LandingLogo } from "@/components/marketing/landing/landing-logo";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Account validated",
};

export default function EmailConfirmedPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const next = safeInternalPath(searchParams.next);
  const continueHref = next ?? "/dashboard";
  const continueLabel = continueHref.startsWith("/cleaner")
    ? "Continue onboarding"
    : continueHref.startsWith("/booking")
      ? "Continue booking"
      : "Go to my account";

  return (
    <main className="flex min-h-screen flex-col bg-[#f9f6ef]">
      <header className="border-b border-[#e8e0d0]/80 bg-[#f9f6ef]/95">
        <div className="mx-auto flex h-14 w-full max-w-[1140px] items-center justify-center px-5 sm:h-16">
          <LandingLogo href="/" />
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-5 py-12 sm:py-16">
        <div className="w-full max-w-md text-center">
          <Image
            alt=""
            aria-hidden
            className="mx-auto h-20 w-20"
            height={80}
            priority
            src="/images/marketing/icons/account-validated.svg"
            width={80}
          />
          <h1 className="mt-6 text-[1.75rem] font-bold tracking-[-0.03em] text-[#1c133b] sm:text-[2rem]">
            Your account has been validated
          </h1>
          <p className="mt-3 text-base leading-7 text-[#5a5470]">
            Welcome! You’re ready to book and manage cleans with Mundoria.
          </p>
          <div className="mt-8 flex justify-center">
            <Button
              asChild
              className="h-12 w-full max-w-xs rounded-full bg-[#1c133b] text-base font-semibold text-white hover:bg-[#1c133b]/90"
            >
              <Link href={continueHref}>{continueLabel}</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-[#8a8498]">
            <Link className="font-medium text-[#1c133b] hover:underline" href="/">
              Browse all services
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
