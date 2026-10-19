import Image from "next/image";

import { ScrollReveal } from "@/components/shared/scroll-reveal";

const cards = [
  {
    body: "From booking and matching to updates and payment, Mundoria keeps the important parts connected so you do not have to piece everything together yourself.",
    icon: "/images/marketing/icons/plain/tools.png",
    title: "Less to manage",
  },
  {
    body: "We estimate the time your clean is likely to need and show you what you are paying for before you book. Clear, understandable and without unnecessary surprises.",
    icon: "/images/marketing/icons/plain/payouts.png",
    title: "No mystery pricing",
  },
  {
    body: "We consider the service, location, timing, preferences and the professional’s experience to help arrange a booking that makes practical sense.",
    icon: "/images/marketing/icons/plain/job-clarity.png",
    title: "More thought behind the booking",
  },
] as const;

export function HowItWorksSection() {
  return (
    <ScrollReveal
      as="section"
      className="px-4 py-16 sm:px-8 sm:py-24"
      id="how-it-works"
      style={{
        backgroundImage:
          "linear-gradient(180deg, #f3eef8 0%, #f7f2fc 45%, #faf8ff 100%)",
      }}
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-[13px] font-medium uppercase tracking-[0.28em] text-[#c79c66] sm:text-sm">
          Why Mundoria works
        </p>
        <h2 className="mt-5 max-w-[16rem] text-[1.9rem] font-medium leading-[1.12] tracking-[-0.03em] text-[#1c133b] sm:max-w-none sm:text-[3.05rem]">
          A better way to get it sorted
        </h2>

        <div className="mt-10 grid items-stretch gap-x-12 gap-y-8 px-6 sm:mt-12 sm:grid-cols-3 sm:gap-x-16 sm:px-8">
          {cards.map(({ body, icon, title }) => (
            <article
              className="relative flex h-full items-center rounded-[1.5rem] bg-[#f5ede3] py-6 pl-11 pr-5 sm:pl-12 sm:pr-6"
              key={title}
            >
              <Image
                alt=""
                className="pointer-events-none absolute left-0 top-1/2 h-[3.5rem] w-[3.5rem] -translate-x-1/2 -translate-y-1/2 object-contain sm:h-16 sm:w-16"
                height={512}
                src={icon}
                width={512}
              />
              <div className="min-w-0">
                <h3 className="text-[1.05rem] font-bold leading-snug tracking-[-0.01em] text-[#1c133b] sm:text-[1.12rem]">
                  {title}
                </h3>
                <p className="mt-2 text-[13px] font-normal leading-[1.5] text-[#4a4558] sm:text-[14px]">
                  {body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </ScrollReveal>
  );
}
