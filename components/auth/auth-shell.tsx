import Image from "next/image";

import { LandingNavbar } from "@/components/marketing/landing/landing-navbar";
import { LANDING_NAV_BLOCK } from "@/components/marketing/landing/nav-metrics";
import { getMarketingViewer } from "@/components/marketing/marketing-shell";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

const LOGIN_MASCOT = "/images/marketing/landing/login-avatar.png";

interface AuthShellProps {
  children: React.ReactNode;
  description: string;
  footer: React.ReactNode;
  title: string;
}

export async function AuthShell({
  children,
  description,
  footer,
  title,
}: AuthShellProps) {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";
  const viewer = await getMarketingViewer();

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#faf8ff]">
      <LandingNavbar customerHref={bookingHref} viewer={viewer} />
      <section
        className="relative px-4 pb-10 sm:px-8 sm:pb-12"
        style={{ paddingTop: `calc(${LANDING_NAV_BLOCK} + 1.5rem)` }}
      >
        <div className="relative mx-auto w-full max-w-[31.25rem]">
          <div className="relative pb-16 sm:pb-[9.5rem]">
            <div className="relative z-10 rounded-[1.5rem] border border-[#e8def8] bg-white px-5 py-6 shadow-[0_18px_40px_rgba(28,19,59,0.08)] sm:rounded-[2rem] sm:border-[#9a91b0] sm:bg-[#f3eef9] sm:px-9 sm:pb-9 sm:pt-8 sm:shadow-none">
              <h1 className="text-[1.65rem] font-bold tracking-[-0.04em] text-[#291845] sm:text-[2.15rem]">
                {title}
              </h1>
              <p className="mt-2 text-sm font-normal leading-6 text-[#6b6680]">
                {description}
              </p>
              <div className="mt-6 sm:mt-7">{children}</div>
            </div>

            <Image
              alt=""
              aria-hidden
              className="pointer-events-none absolute bottom-0 right-1 z-20 h-auto w-[7.25rem] select-none sm:right-0 sm:w-[13.5rem] sm:translate-x-[45%] md:w-[14.5rem] md:translate-x-[55%]"
              height={519}
              src={LOGIN_MASCOT}
              width={455}
            />
          </div>

          <div className="relative z-10 mt-3 text-center text-sm text-[#6b6680] sm:mt-3">
            {footer}
          </div>
        </div>
      </section>
    </main>
  );
}
