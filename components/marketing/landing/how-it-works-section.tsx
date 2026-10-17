import Image from "next/image";

import { ScrollReveal } from "@/components/shared/scroll-reveal";

const cards = [
  {
    body: "From booking and matching to updates and payment, Mundoria keeps the important parts connected so you do not have to piece everything together yourself.",
    icon: "/images/marketing/icons/simple.png",
    title: "Less to manage",
  },
  {
    body: "We estimate the time your clean is likely to need and show you what you are paying for before you book. Clear, understandable and without unnecessary surprises.",
    icon: "/images/marketing/icons/reliable.png",
    title: "No mystery pricing",
  },
  {
    body: "We consider the service, location, timing, preferences and the professional’s experience to help arrange a booking that makes practical sense.",
    icon: "/images/marketing/icons/flexible.png",
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

        <div className="mt-10 grid gap-3 sm:mt-12 sm:grid-cols-3 sm:gap-4">
          {cards.map(({ body, icon, title }) => (
            <article
              className="relative min-h-[9.5rem] overflow-hidden rounded-[1.75rem] bg-[#f3efe6] px-5 pb-14 pt-5 sm:min-h-[10.5rem] sm:px-6 sm:pb-16 sm:pt-6"
              key={title}
            >
              <h3 className="pr-14 text-[1.05rem] font-bold leading-tight text-[#1c133b] sm:text-[1.15rem]">
                {title}
              </h3>
              <p className="mt-2 max-w-[15.5rem] text-[13px] font-normal leading-[1.45] text-[#3d3a48] sm:text-[14px] sm:leading-[1.5]">
                {body}
              </p>
              <Image
                alt=""
                className="pointer-events-none absolute bottom-3 right-3 h-14 w-14 rounded-full object-cover sm:bottom-4 sm:right-4 sm:h-16 sm:w-16"
                height={512}
                src={icon}
                width={512}
              />
            </article>
          ))}
        </div>
      </div>
    </ScrollReveal>
  );
}
