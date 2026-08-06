import { LockKeyhole, ShieldCheck } from "lucide-react";

import { BrandLogo } from "@/components/shared/brand-mark";

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
    <main className="grid min-h-screen bg-[#111026] text-white lg:grid-cols-[0.96fr_1.04fr]">
      <section className="relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-28 top-10 h-80 w-80 rounded-full bg-[#5a51aa]/35 blur-3xl" />
        <div className="absolute -bottom-28 left-10 h-80 w-80 rounded-full bg-[#ffc79f]/15 blur-3xl" />

        <BrandLogo
          className="relative"
          markClassName="h-12 w-9"
          wordmarkClassName="text-white"
        />

        <div className="relative max-w-xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/75">
            <ShieldCheck className="h-4 w-4 text-[#ffc79f]" />
            Invite-only platform access
          </p>
          <h1 className="mt-7 text-5xl font-semibold leading-[1.02] tracking-[-0.06em]">
            CleanScape command centre.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-8 text-white/65">
            Secure access for authorised operators managing bookings, cleaner
            certification, payouts, disputes, zones and platform health.
          </p>
        </div>

        <p className="relative text-sm text-white/45">
          Admin activity is permission-gated and recorded for operational audit.
        </p>
      </section>

      <section className="flex items-center justify-center bg-background px-5 py-10 text-foreground sm:px-8 lg:rounded-l-[2.5rem]">
        <div className="w-full max-w-md">
          <BrandLogo className="mb-10 lg:hidden" markClassName="h-11 w-8" />

          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-2xl shadow-[#221f50]/10 sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#221f50] text-white">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <h2 className="mt-6 text-3xl font-semibold tracking-[-0.04em]">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
            <div className="mt-8">{children}</div>
          </div>

          {footer ? (
            <div className="mt-7 text-center text-sm text-muted-foreground">
              {footer}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
