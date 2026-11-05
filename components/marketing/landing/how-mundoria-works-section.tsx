import Image from "next/image";
import Link from "next/link";

import { ScrollReveal } from "@/components/shared/scroll-reveal";

const STEPS = [
  {
    body: "Tell us what you need cleaned, where and when. Got any special requests? Add those too.",
    icon: "/images/marketing/icons/plain/how-choose.png",
    title: "Choose",
  },
  {
    body: "We’ll use your booking details to look for a cleaner who fits your needs.",
    icon: "/images/marketing/icons/plain/how-arrange.png",
    title: "We arrange it",
  },
  {
    body: "Check your booking, get updates, make changes and manage payments, all in one place.",
    icon: "/images/marketing/icons/plain/how-loop.png",
    title: "Stay in the loop",
  },
] as const;

export function HowMundoriaWorksSection() {
  return (
    <ScrollReveal
      as="section"
      className="bg-[#f3efe6] px-4 py-16 sm:px-8 sm:py-20"
      id="how-mundoria-works"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,2.1fr)] lg:items-start lg:gap-8 xl:gap-12">
          <div className="max-w-sm lg:pt-2">
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#c79c66] sm:text-[13px]">
              How Mundoria works
            </p>
            <h2 className="mt-4 text-[1.85rem] font-semibold leading-[1.12] tracking-[-0.03em] text-[#1c133b] sm:text-[2.35rem]">
              Do you need a clean?
              <br />
              Looking for cleaning work?
            </h2>
            <p className="mt-4 text-pretty text-[14px] font-light leading-6 text-[#5a5470] sm:text-[15px] sm:leading-7">
              Get help with the cleaning and more time for yourself. Keep track
              of your booking, with updates along the way. If you’re a cleaner,
              find jobs and keep track of your bookings, reviews and payments in
              one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="inline-flex h-10 items-center justify-center rounded-full bg-[#1c133b] px-5 text-[12px] font-semibold text-white transition hover:bg-[#1c133b]/90"
                href="/booking/new"
              >
                Book my clean
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center rounded-full bg-[#c79c66] px-5 text-[12px] font-semibold text-[#1c133b] transition hover:bg-[#c79c66]/90"
                href="/for-cleaners"
              >
                Become a cleaner
              </Link>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3 sm:gap-0">
            {STEPS.map((step, index) => (
              <article
                className="relative flex flex-col sm:px-5 lg:px-6"
                key={step.title}
              >
                {index > 0 ? (
                  <span
                    aria-hidden
                    className="absolute bottom-2 left-0 top-2 hidden w-px bg-[#d9d2c6] sm:block"
                  />
                ) : null}
                <div className="relative mx-auto h-28 w-28 shrink-0 overflow-hidden sm:mx-0 sm:h-32 sm:w-32">
                  <Image
                    alt=""
                    className="object-contain object-center"
                    fill
                    sizes="128px"
                    src={step.icon}
                  />
                </div>
                <h3 className="mt-5 text-center text-[1.15rem] font-bold tracking-[-0.02em] text-[#1c133b] sm:text-left">
                  {step.title}
                </h3>
                <p className="mt-2 text-center text-[13.5px] font-light leading-6 text-[#5a5470] sm:text-left">
                  {step.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}
