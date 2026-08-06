import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/components/shared/brand-mark";

interface AuthShellProps {
  children: React.ReactNode;
  description: string;
  footer: React.ReactNode;
  title: string;
}

export function AuthShell({
  children,
  description,
  footer,
  title,
}: AuthShellProps) {
  return (
    <main className="grid min-h-screen bg-[#221f50] lg:grid-cols-[0.92fr_1.08fr]">
      <section className="relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-28 top-8 h-72 w-72 rounded-full bg-[#7669d1]/35 blur-3xl" />
        <div className="absolute -left-20 bottom-20 h-56 w-56 rounded-full bg-[#ffc79f]/25 blur-3xl" />
        <Link className="relative flex items-center gap-3" href="/">
          <BrandMark />
          <span className="text-xl font-semibold tracking-tight">
            cleanscape
          </span>
        </Link>
        <div className="relative max-w-lg">
          {/* <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/80 backdrop-blur">
            <Sparkles className="h-4 w-4 text-[#ffc79f]" />
            Cleaning, thoughtfully matched
          </div> */}
          <h2 className="mt-6 text-5xl font-semibold leading-[1.02] tracking-[-0.06em]">
            A calmer way to book and manage cleaning.
          </h2>
          <div className="mt-8 space-y-4 text-sm text-white/75">
            {[
              "Certified independent cleaners",
              "Protected card authorization",
              "Live booking status, messages, and checklists",
            ].map((item) => (
              <p className="flex items-center gap-3" key={item}>
                <CheckCircle2 className="h-5 w-5 text-[#ffc79f]" />
                {item}
              </p>
            ))}
          </div>
        </div>
        <p className="relative text-sm text-white/60">
          Trusted local cleaning, managed in one clear place.
        </p>
      </section>

      <section className="flex items-center justify-center bg-background px-5 py-10 sm:px-8 lg:rounded-l-[2.5rem]">
        <div className="w-full max-w-md">
          <Link
            className="mb-10 inline-flex items-center gap-3 text-xl font-semibold text-foreground lg:hidden"
            href="/"
          >
            <BrandMark className="h-10 w-7" />
            cleanscape
          </Link>
          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-2xl shadow-[#5a51aa]/10 sm:p-8">
            {/* <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
              CleanScape
            </p> */}
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
            <div className="mt-8">{children}</div>
          </div>
          <div className="mt-7 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        </div>
      </section>
    </main>
  );
}
