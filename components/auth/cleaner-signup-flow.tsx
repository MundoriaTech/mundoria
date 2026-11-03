"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormStatus } from "@/components/auth/form-status";
import { SignupForm } from "@/components/auth/signup-form";
import { LandingNavbar } from "@/components/marketing/landing/landing-navbar";
import { LANDING_NAV_BLOCK } from "@/components/marketing/landing/nav-metrics";
import { Button } from "@/components/ui/button";
import { FEMALE_AVATAR_SRC } from "@/lib/avatars/default-pack";
import { dashboardForRole } from "@/lib/auth/redirects";
import { rememberSignupEmail } from "@/lib/auth/signup-email-pending";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/auth";

export function CleanerSignupFlow({
  bookingHref,
  viewer,
}: {
  bookingHref: string;
  viewer: Pick<Profile, "id" | "full_name" | "avatar_url" | "role"> | null;
}) {
  const router = useRouter();
  const [readyAccount, setReadyAccount] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [continuing, setContinuing] = useState(false);
  const [continueError, setContinueError] = useState<string | null>(null);

  async function openDashboard() {
    if (!readyAccount) return;
    setContinuing(true);
    setContinueError(null);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: readyAccount.email,
        password: readyAccount.password,
      });
      if (error) {
        rememberSignupEmail(readyAccount.email);
        router.replace("/login/cleaner?created=1");
        return;
      }
      router.replace(`${dashboardForRole("cleaner")}?welcome=1`);
      router.refresh();
    } catch (error) {
      setContinuing(false);
      setContinueError(
        error instanceof Error
          ? error.message
          : "Unable to open your dashboard. Try signing in.",
      );
    }
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#faf8ff]">
      <LandingNavbar customerHref={bookingHref} viewer={viewer} />
      <section
        className="relative px-4 pb-10 sm:px-8 sm:pb-12"
        style={{ paddingTop: `calc(${LANDING_NAV_BLOCK} + 1.5rem)` }}
      >
        <div className="relative mx-auto w-full max-w-[31.25rem]">
          <div className="relative pb-16 sm:pb-[9.5rem]">
            {readyAccount ? (
              <div className="relative z-10 space-y-6">
                <FormStatus
                  message={continueError}
                  title="Couldn’t open your dashboard"
                />
                <div className="rounded-2xl border border-[#d9f0df] bg-[#f3fbf5] px-5 py-8 text-center shadow-[0_18px_40px_rgba(28,19,59,0.06)] sm:px-8 sm:py-10">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1f7a45] text-lg font-semibold text-white">
                    ✓
                  </div>
                  <h1 className="mt-4 text-xl font-semibold tracking-tight text-[#1c133b] sm:text-2xl">
                    Your cleaner account is ready
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-[#5a5470]">
                    You’re verified. Open your dashboard when you’re ready to
                    start onboarding.
                  </p>
                  <Button
                    className="mt-6 w-full"
                    disabled={continuing}
                    onClick={() => void openDashboard()}
                    type="button"
                  >
                    {continuing ? "Opening dashboard…" : "Go to dashboard"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative z-10 rounded-[1.5rem] border border-[#e8def8] bg-white px-5 py-6 shadow-[0_18px_40px_rgba(28,19,59,0.08)] sm:rounded-[2rem] sm:border-[#9a91b0] sm:bg-[#f3eef9] sm:px-9 sm:pb-9 sm:pt-8 sm:shadow-none">
                <h1 className="text-[1.65rem] font-bold tracking-[-0.04em] text-[#291845] sm:text-[2.15rem]">
                  Create your cleaner account
                </h1>
                <p className="mt-2 text-sm font-normal leading-6 text-[#6b6680]">
                  Join Mundoria as an independent cleaning professional.
                </p>
                <div className="mt-6 sm:mt-7">
                  <SignupForm
                    onAccountReady={(account) => setReadyAccount(account)}
                    role="cleaner"
                  />
                </div>
              </div>
            )}

            <Image
              alt=""
              aria-hidden
              className="pointer-events-none absolute bottom-0 right-1 z-20 h-auto w-[7.25rem] select-none sm:right-0 sm:w-[13.5rem] sm:translate-x-[45%] md:w-[14.5rem] md:translate-x-[55%]"
              height={519}
              src={FEMALE_AVATAR_SRC}
              width={455}
            />
          </div>

          {!readyAccount ? (
            <div className="relative z-10 mt-3 text-center text-sm text-[#6b6680] sm:mt-3">
              Already have an account?{" "}
              <Link
                className="font-semibold text-[#291845] hover:underline"
                href="/login/cleaner"
              >
                Sign in
              </Link>
              <span className="mt-2 block text-sm text-muted-foreground">
                Looking to book a cleaner?{" "}
                <Link
                  className="font-semibold text-[#291845] hover:underline"
                  href="/signup"
                >
                  Create a customer account
                </Link>
              </span>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
