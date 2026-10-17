import Image from "next/image";

import { ScrollReveal } from "@/components/shared/scroll-reveal";

const STEPS = [
  {
    body: "Tell us what you need, where and when. Add any details or preferences that matter to you.",
    image: "/images/marketing/landing/how-step-choose.png",
    title: "Choose",
  },
  {
    body: "Mundoria uses your booking details to help find a suitable professional and keep everything organised in one place.",
    image: "/images/marketing/landing/how-step-arrange.png",
    title: "We arrange it",
  },
  {
    body: "Follow your booking, receive updates, manage changes and keep payment connected to the service.",
    image: "/images/marketing/landing/how-step-loop.png",
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
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,2.1fr)] lg:items-start lg:gap-8 xl:gap-12">
        <div className="max-w-sm lg:pt-2">
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#c79c66] sm:text-[13px]">
            How Mundoria works
          </p>
          <h2 className="mt-4 text-[1.85rem] font-semibold leading-[1.12] tracking-[-0.03em] text-[#1c133b] sm:text-[2.35rem]">
            <span className="font-medium text-[#3d3650]">Simple on the surface.</span>
            <br />
            Serious underneath.
          </h2>
          <p className="mt-4 text-pretty text-[14px] font-light leading-6 text-[#5a5470] sm:text-[15px] sm:leading-7">
            You shouldn’t have to manage the complicated parts. Mundoria keeps
            the booking, matching, updates and payment working quietly in the
            background.
          </p>
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
              <div className="relative mx-auto aspect-[5/4] w-full max-w-[13.5rem]">
                <Image
                  alt=""
                  className="object-contain object-center"
                  fill
                  sizes="220px"
                  src={step.image}
                />
              </div>
              <h3 className="mt-4 text-center text-[1.15rem] font-bold tracking-[-0.02em] text-[#1c133b] sm:text-left">
                {step.title}
              </h3>
              <p className="mt-2 text-center text-[13.5px] font-light leading-6 text-[#5a5470] sm:text-left">
                {step.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </ScrollReveal>
  );
}
