import Link from "next/link";
import type { ReactNode } from "react";

import { LandingLogo } from "@/components/marketing/landing/landing-logo";
import { ContactSupportButton } from "@/components/shared/contact-support-button";
import { ZohoSalesIqWidget } from "@/components/shared/zoho-salesiq";
import { cn } from "@/lib/utils";

/** Standalone Help Centre chrome — logo bar only, no marketing navbar/footer. */
export function HelpShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-screen flex-col bg-[#faf8ff] text-foreground",
        className,
      )}
    >
      <header className="sticky top-0 z-40 border-b border-[#1c133b]/8 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-8 lg:px-12">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <LandingLogo className="text-[1.2rem] sm:text-[1.35rem]" href="/" />
            <span
              aria-hidden
              className="hidden h-5 w-px bg-[#1c133b]/15 sm:block"
            />
            <Link
              className="truncate text-sm font-semibold text-[#5a5470] transition hover:text-[#1c133b]"
              href="/help"
            >
              Help Centre
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              className="hidden text-sm font-medium text-[#5a5470] transition hover:text-[#1c133b] sm:inline"
              href="/"
            >
              Back to Mundoria
            </Link>
            <ContactSupportButton className="inline-flex h-9 items-center justify-center rounded-full bg-[#6a45b8] px-4 text-xs font-semibold text-white transition hover:bg-[#5a38a3] sm:text-sm" />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[#1c133b]/8 bg-white px-4 py-6 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm text-[#5a5470] sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="font-semibold text-[#1c133b]">Mundoria Help</span>
            {" · "}
            Advice from the Mundoria team
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link className="hover:text-[#1c133b]" href="/">
              mundoria.com
            </Link>
            <Link className="hover:text-[#1c133b]" href="/blog">
              Mag
            </Link>
            <Link className="hover:text-[#1c133b]" href="/privacy">
              Privacy
            </Link>
            <Link className="hover:text-[#1c133b]" href="/terms">
              Terms
            </Link>
          </div>
        </div>
      </footer>

      <ZohoSalesIqWidget />
    </div>
  );
}
