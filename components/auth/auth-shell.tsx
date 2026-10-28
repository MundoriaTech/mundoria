import Image from "next/image";

import { LandingFooter } from "@/components/marketing/landing/landing-footer";
import { LandingNavbar } from "@/components/marketing/landing/landing-navbar";
import { LANDING_NAV_BLOCK } from "@/components/marketing/landing/nav-metrics";
import { getMarketingViewer } from "@/components/marketing/marketing-shell";
import {
  Reveal,
  Stagger,
  StaggerItem,
} from "@/components/shared/motion-primitives";
import { FEMALE_AVATAR_SRC } from "@/lib/avatars/default-pack";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

interface AuthShellProps {
  children: React.ReactNode;
  description: string;
  footer: React.ReactNode;
  /** Site-wide marketing footer (customer login/signup). */
  showSiteFooter?: boolean;
  title: string;
}

export async function AuthShell({
  children,
  description,
  footer,
  showSiteFooter = false,
  title,
}: AuthShellProps) {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";
  const cleanerHref = configured ? "/signup/cleaner" : "/setup";
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
            <Reveal
              className="relative z-10 rounded-[1.5rem] border border-[#e8def8] bg-white px-5 py-6 shadow-[0_18px_40px_rgba(28,19,59,0.08)] sm:rounded-[2rem] sm:border-[#9a91b0] sm:bg-[#f3eef9] sm:px-9 sm:pb-9 sm:pt-8 sm:shadow-none"
              distance={28}
              from="up"
            >
              <Stagger delay={0.12} gap={0.08}>
                <StaggerItem distance={18} from="left">
                  <h1 className="text-[1.65rem] font-bold tracking-[-0.04em] text-[#291845] sm:text-[2.15rem]">
                    {title}
                  </h1>
                </StaggerItem>
                <StaggerItem distance={18} from="left">
                  <p className="mt-2 text-sm font-normal leading-6 text-[#6b6680]">
                    {description}
                  </p>
                </StaggerItem>
                <StaggerItem className="mt-6 sm:mt-7" distance={16} from="up">
                  {children}
                </StaggerItem>
              </Stagger>
            </Reveal>

            <Reveal
              className="pointer-events-none absolute bottom-0 right-1 z-20 w-[7.25rem] select-none sm:right-0 sm:w-[13.5rem] sm:translate-x-[45%] md:w-[14.5rem] md:translate-x-[55%]"
              delay={0.35}
              distance={40}
              from="up-right"
            >
              <Image
                alt=""
                aria-hidden
                className="h-auto w-full"
                height={519}
                src={FEMALE_AVATAR_SRC}
                width={455}
              />
            </Reveal>
          </div>

          <Reveal
            className="relative z-10 mt-3 text-center text-sm text-[#6b6680] sm:mt-3"
            delay={0.45}
            distance={10}
          >
            {footer}
          </Reveal>
        </div>
      </section>
      {showSiteFooter ? (
        <LandingFooter cleanerHref={cleanerHref} configured={configured} />
      ) : null}
    </main>
  );
}
