import { LockKeyhole, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { LandingLogo } from "@/components/marketing/landing/landing-logo";

interface AdminAuthShellProps {
  children: React.ReactNode;
  description: string;
  footer?: React.ReactNode;
  title: string;
}

export function AdminAuthShell({
  children,
  description,
  footer,
  title,
}: AdminAuthShellProps) {
  return (
    <main className="grid min-h-screen bg-[#1c133b] text-white lg:grid-cols-[0.96fr_1.04fr]">
      <section className="relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-28 top-10 h-80 w-80 rounded-full bg-[#f0a888]/25 blur-3xl" />
        <div className="absolute -bottom-28 left-10 h-80 w-80 rounded-full bg-[#823fb2]/40 blur-3xl" />

        <div className="relative">
          <LandingLogo className="text-[1.6rem]" href="/" variant="onDark" />
          <p className="-mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f0a888]">
            Operations
          </p>
        </div>

        <div className="relative max-w-xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80">
            <ShieldCheck className="h-4 w-4 text-[#f0a888]" />
            Invite-only platform access
          </p>
          <h1 className="mt-7 text-5xl font-semibold leading-[1.02] tracking-[-0.06em]">
            Mundoria operations desk.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-8 text-white/65">
            Secure access for authorised operators managing bookings, cleaners,
            Mag, payouts, disputes, and coverage.
          </p>
        </div>

        <p className="relative text-sm text-white/45">
          Admin activity is permission-gated and recorded for operational audit.
        </p>
      </section>

      <section className="relative flex items-center justify-center bg-[#faf8ff] px-5 py-10 text-[#1c133b] sm:px-8 lg:rounded-l-[2.5rem]">
        <div className="w-full max-w-md pt-4 lg:pt-0">
          <Link className="mb-10 inline-block lg:hidden" href="/">
            <LandingLogo className="text-[1.4rem]" />
            <p className="-mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#823fb2]">
              Operations
            </p>
          </Link>

          <div className="rounded-[2rem] border border-[#e8e0f4] bg-white p-6 shadow-[0_24px_60px_rgba(28,19,59,0.1)] sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1c133b] text-white">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <h2 className="mt-6 text-3xl font-semibold tracking-[-0.04em]">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#5a5470]">{description}</p>
            <div className="mt-8">{children}</div>
          </div>

          {footer ? (
            <div className="mt-7 text-center text-sm text-[#5a5470]">{footer}</div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
