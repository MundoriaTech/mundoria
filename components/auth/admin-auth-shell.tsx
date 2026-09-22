import { LockKeyhole } from "lucide-react";

import { LandingNavbar } from "@/components/marketing/landing/landing-navbar";
import { LANDING_NAV_BLOCK } from "@/components/marketing/landing/nav-metrics";
import { getMarketingViewer } from "@/components/marketing/marketing-shell";
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
    <main className="min-h-screen bg-[#faf8ff] text-[#1c133b]">
      <LandingNavbar customerHref={bookingHref} viewer={viewer} />
      <div
        className="flex items-center justify-center px-5 pb-10 sm:px-8"
        style={{
          minHeight: `calc(100vh - ${LANDING_NAV_BLOCK})`,
          paddingTop: `calc(${LANDING_NAV_BLOCK} + 1.5rem)`,
        }}
      >
        <div className="w-full max-w-md">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#823fb2]">
            Operations
          </p>

          <div className="mt-3 rounded-[2rem] border border-[#e8e0f4] bg-white p-6 shadow-[0_24px_60px_rgba(28,19,59,0.1)] sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1c133b] text-white">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <h1 className="mt-6 text-3xl font-semibold tracking-[-0.04em]">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#5a5470]">{description}</p>
            <div className="mt-8">{children}</div>
          </div>

          {footer ? (
            <div className="mt-7 text-center text-sm text-[#5a5470]">{footer}</div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
