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
    <main className="relative min-h-screen overflow-x-hidden bg-[#faf8ff]">
      <section className="relative isolate overflow-hidden bg-[#291845]">
        <div className="absolute inset-0">
          <Image
            alt=""
            aria-hidden
            className="object-cover object-[62%_center] opacity-50 sm:object-[75%_center] sm:opacity-55"
            fill
            priority
            sizes="100vw"
            src={LOGIN_HERO}
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-[#291845]/75 via-[#291845]/88 to-[#291845] sm:bg-gradient-to-r sm:from-[#291845] sm:via-[#291845]/88 sm:to-[#291845]/45"
          />
        </div>

        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:gap-6 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
          <LandingLogo
            className="h-7 sm:h-9"
            href="/"
            priority
            variant="onDark"
          />

          <div className="max-w-xl">
            <h2 className="text-balance text-[1.5rem] font-semibold leading-[1.15] tracking-[-0.03em] text-white sm:text-[2rem] lg:text-[2.15rem]">
              A calmer way to book and manage{" "}
              <span className="text-[#c79c66]">cleaning</span>
            </h2>
            <ul className="mt-3 space-y-1.5 text-[13px] font-normal leading-5 text-white/90 sm:mt-5 sm:text-sm sm:leading-6">
              {HERO_POINTS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="relative px-4 pb-10 pt-6 sm:px-8 sm:pb-12 sm:pt-10">
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
