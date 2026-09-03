import Link from "next/link";

import { LazyImage } from "@/components/shared/lazy-image";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { Button } from "@/components/ui/button";

const points = [
  "Helping customers reclaim time without losing control of the job.",
  "Giving independent cleaners clearer work, fairer reviews and payout visibility.",
  "Building a cleaning platform where every booking has status, evidence and accountability.",
] as const;

export function AboutSection({
  cleanerHref,
  customerHref,
}: {
  cleanerHref: string;
  customerHref: string;
}) {
  return (
    <ScrollReveal
      as="section"
      className="relative overflow-hidden bg-[#f4ebfe] px-5 py-16 sm:px-8 sm:py-20"
      id="about"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(130,63,178,0.12), transparent 45%), radial-gradient(circle at 80% 70%, rgba(199,156,102,0.12), transparent 40%)",
        }}
      />
      <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-md lg:mx-0 lg:max-w-lg">
          <LazyImage
            alt="CleanScape brand illustration of a friendly cleaner"
            className="object-contain object-bottom"
            fill
            sizes="(min-width: 1024px) 420px, 90vw"
            src="/images/marketing/landing/about-illustration.png"
          />
        </div>

        <div>
          <h2 className="max-w-md text-[2rem] font-bold leading-[1.15] tracking-[-0.03em] text-[#1c133b] sm:text-[2.35rem]">
            Home services with a visible standard.
          </h2>
          <div className="mt-6 max-w-lg divide-y divide-[#1c133b]/20 border-y border-[#1c133b]/20">
            {points.map((item) => (
              <p
                className="py-4 text-[13px] font-light leading-7 text-[#1c133b]/85"
                key={item}
              >
                {item}
              </p>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              className="h-[33px] rounded-full bg-[#1c133b] px-5 text-[12px] font-semibold text-[#e6e5f3] hover:bg-[#1c133b]/90"
            >
              <Link href={customerHref}>Book a clean</Link>
            </Button>
            <Button
              asChild
              className="h-[33px] rounded-full bg-[#c79c66] px-5 text-[12px] font-semibold text-[#1c133b] hover:bg-[#c79c66]/90"
            >
              <Link href={cleanerHref}>Become a cleaner</Link>
            </Button>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}
