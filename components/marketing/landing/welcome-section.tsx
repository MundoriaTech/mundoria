import Link from "next/link";

import { LandingLogo } from "@/components/marketing/landing/landing-logo";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { Button } from "@/components/ui/button";

const WELCOME_CARD_GRADIENT =
  "linear-gradient(121.78deg, #c79c66 41.065%, #ac742f 118.33%)";

const features = [
  "Live booking status",
  "In-app cleaner messaging",
  "Checklist-led completion",
  "Secure card payment",
] as const;

export function WelcomeSection({ customerHref }: { customerHref: string }) {
  return (
    <ScrollReveal
      as="section"
      className="overflow-x-clip bg-[#1c133b] px-4 py-14 text-white sm:px-8 sm:py-20"
    >
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-10">
        <div>
          <LandingLogo variant="onDark" />
          <h2 className="mt-5 text-balance text-[2rem] font-medium leading-tight tracking-[-0.02em] sm:mt-6 sm:text-[40px] sm:leading-[35px]">
            Welcome home.
          </h2>
          <p className="mt-4 max-w-sm text-pretty text-[13px] font-normal leading-5 text-white sm:text-[12px] sm:leading-[17px]">
            Book, message, track, confirm and pay from one calm place.
            CleanScape keeps the service simple on the surface and rigorous
            underneath.
          </p>
        </div>

        <div
          className="rounded-[11px] p-5 text-white sm:p-8"
          style={{ backgroundImage: WELCOME_CARD_GRADIENT }}
        >
          <div className="divide-y divide-white/35 text-[12px] font-normal leading-[17px] sm:text-[12px]">
            {features.map((item) => (
              <div className="py-3.5 first:pt-0 last:pb-0" key={item}>
                {item}
              </div>
            ))}
          </div>
          <Button
            asChild
            className="mt-6 h-11 w-full rounded-full bg-[#1c133b] px-5 text-[13px] font-semibold text-[#e6e5f3] hover:bg-[#1c133b]/90 sm:h-8 sm:w-auto sm:text-[12px]"
          >
            <Link href={customerHref}>Book a clean</Link>
          </Button>
        </div>
      </div>
    </ScrollReveal>
  );
}
