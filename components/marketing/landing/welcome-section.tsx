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
      className="bg-[#1c133b] px-5 py-16 text-white sm:px-8 sm:py-20"
    >
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div>
          <LandingLogo variant="onDark" />
          <h2 className="mt-6 text-[40px] font-medium leading-[35px] tracking-[-0.02em]">
            Welcome home.
          </h2>
          <p className="mt-4 max-w-sm text-[12px] font-normal leading-[17px] text-white">
            Book, message, track, confirm and pay from one calm place.
            CleanScape keeps the service simple on the surface and rigorous
            underneath.
          </p>
        </div>

        <div
          className="rounded-[11px] p-6 text-white sm:p-8"
          style={{ backgroundImage: WELCOME_CARD_GRADIENT }}
        >
          <div className="divide-y divide-white/35 text-[11px] font-normal leading-[17px] sm:text-[12px]">
            {features.map((item) => (
              <div className="py-3.5 first:pt-0 last:pb-0" key={item}>
                {item}
              </div>
            ))}
          </div>
          <Button
            asChild
            className="mt-6 h-8 rounded-full bg-[#1c133b] px-5 text-[12px] font-semibold text-[#e6e5f3] hover:bg-[#1c133b]/90"
          >
            <Link href={customerHref}>Book a clean</Link>
          </Button>
        </div>
      </div>
    </ScrollReveal>
  );
}
