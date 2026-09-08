import Image from "next/image";

import { LandingLogo } from "@/components/marketing/landing/landing-logo";

const LOGIN_HERO = "/images/marketing/landing/login-hero.png";
const LOGIN_MASCOT = "/images/marketing/landing/login-avatar.png";

const HERO_POINTS = [
  "Certified independent cleaners",
  "Secure card payment",
  "Live booking status, messages, and checklists",
] as const;

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
    <main className="relative min-h-screen bg-[#ebe4f8]">
      <section className="relative isolate overflow-hidden bg-[#291845]">
        <div className="absolute inset-0">
          <Image
            alt=""
            aria-hidden
            className="object-cover object-[70%_center] opacity-55 sm:object-[75%_center]"
            fill
            priority
            sizes="100vw"
            src={LOGIN_HERO}
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-[#291845] via-[#291845]/88 to-[#291845]/45"
          />
        </div>

        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-7 sm:gap-6 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
          <LandingLogo className="h-8 sm:h-9" href="/" priority variant="onDark" />

          <div className="max-w-xl pb-1 sm:pb-2">
            <h2 className="text-balance text-[1.65rem] font-semibold leading-[1.12] tracking-[-0.03em] text-white sm:text-[2rem] lg:text-[2.15rem]">
              A calmer way to book and manage{" "}
              <span className="text-[#c79c66]">cleaning</span>
            </h2>
            <ul className="mt-4 space-y-1.5 text-[13px] font-normal leading-5 text-white/95 sm:mt-5 sm:text-sm sm:leading-6">
              {HERO_POINTS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="relative px-4 pb-8 pt-8 sm:px-8 sm:pt-10">
        <div className="relative mx-auto w-full max-w-[31.25rem]">
          {/*
            Padding-bottom reserves space for the mascot so absolute positioning
            cannot clip her feet at the viewport edge.
          */}
          <div className="relative pb-[8.75rem] sm:pb-[9.5rem]">
            <div className="relative z-10 rounded-[1.75rem] border border-[#9a91b0] bg-[#f3eef9] px-6 pb-8 pt-7 sm:rounded-[2rem] sm:px-9 sm:pb-9 sm:pt-8">
              <h1 className="text-[1.85rem] font-bold tracking-[-0.04em] text-[#291845] sm:text-[2.15rem]">
                {title}
              </h1>
              <p className="mt-2 text-sm font-normal leading-6 text-[#6b6680]">
                {description}
              </p>
              <div className="mt-7">{children}</div>
            </div>

            <Image
              alt=""
              aria-hidden
              className="pointer-events-none absolute bottom-0 right-0 z-20 h-auto w-[10.5rem] translate-x-[40%] select-none sm:w-[13.5rem] sm:translate-x-[55%] md:w-[14.5rem] md:translate-x-[60%]"
              height={519}
              src={LOGIN_MASCOT}
              width={455}
            />
          </div>

          <div className="relative z-10 mt-2 text-center text-sm text-[#6b6680] sm:mt-3">
            {footer}
          </div>
        </div>
      </section>
    </main>
  );
}
