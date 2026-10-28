import { LockKeyhole } from "lucide-react";

import { LandingNavbar } from "@/components/marketing/landing/landing-navbar";
import { LANDING_NAV_BLOCK } from "@/components/marketing/landing/nav-metrics";
import { getMarketingViewer } from "@/components/marketing/marketing-shell";
import {
  Reveal,
  Stagger,
  StaggerItem,
} from "@/components/shared/motion-primitives";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

interface AdminAuthShellProps {
  children: React.ReactNode;
  description: string;
  footer?: React.ReactNode;
  title: string;
}

export async function AdminAuthShell({
  children,
  description,
  footer,
  title,
}: AdminAuthShellProps) {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";
  const viewer = await getMarketingViewer();

  return (
    <main className="min-h-screen bg-brand-haze text-brand-ink">
      <LandingNavbar customerHref={bookingHref} viewer={viewer} />
      <div
        className="flex items-center justify-center px-5 pb-10 sm:px-8"
        style={{
          minHeight: `calc(100vh - ${LANDING_NAV_BLOCK})`,
          paddingTop: `calc(${LANDING_NAV_BLOCK} + 1.5rem)`,
        }}
      >
        <div className="w-full max-w-md">
          <Reveal distance={8} from="left">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-violet">
              Operations
            </p>
          </Reveal>

          <Reveal
            className="mt-3 rounded-[2rem] border border-[#e8e0f4] bg-white p-6 shadow-[0_24px_60px_rgba(28,19,59,0.1)] sm:p-8"
            delay={0.08}
            from="scale"
          >
            <Stagger delay={0.2} gap={0.08}>
              <StaggerItem distance={0} from="scale">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-ink text-white">
                  <LockKeyhole className="h-5 w-5" />
                </div>
              </StaggerItem>
              <StaggerItem distance={16} from="left">
                <h1 className="mt-6 text-3xl font-semibold tracking-[-0.04em]">
                  {title}
                </h1>
              </StaggerItem>
              <StaggerItem distance={16} from="left">
                <p className="mt-2 text-sm leading-6 text-brand-muted">
                  {description}
                </p>
              </StaggerItem>
              <StaggerItem className="mt-8" distance={16} from="up">
                {children}
              </StaggerItem>
            </Stagger>
          </Reveal>

          {footer ? (
            <Reveal
              className="mt-7 text-center text-sm text-brand-muted"
              delay={0.5}
              distance={10}
            >
              {footer}
            </Reveal>
          ) : null}
        </div>
      </div>
    </main>
  );
}
