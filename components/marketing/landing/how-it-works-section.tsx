import {
  CircleCheckBig,
  MousePointerClick,
  Route,
  type LucideIcon,
} from "lucide-react";

import { ScrollReveal } from "@/components/shared/scroll-reveal";

const steps: {
  color: string;
  description: string;
  icon: LucideIcon;
  title: string;
}[] = [
  {
    color: "#1c133b",
    description:
      "Pick a category, service and standard — we advise if something fits better.",
    icon: MousePointerClick,
    title: "Choose",
  },
  {
    color: "#e67248",
    description:
      "See booking progress, cleaner assignment and messages in one place.",
    icon: Route,
    title: "Track",
  },
  {
    color: "#c79c66",
    description:
      "Review the checklist after completion before payment is captured.",
    icon: CircleCheckBig,
    title: "Confirm",
  },
];

export function HowItWorksSection() {
  return (
    <ScrollReveal
      as="section"
      className="bg-[#f5ebe0] px-4 py-14 sm:px-8 sm:py-20"
      id="how-it-works"
    >
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-16">
        <div>
          <p className="text-[11px] font-normal uppercase tracking-[0.32em] text-[#c79c66]">
            Why it Works
          </p>
          <h2 className="mt-3 max-w-none text-balance text-[1.75rem] leading-[1.12] tracking-[-0.03em] text-[#1c133b] sm:max-w-[16rem] sm:text-[2.35rem]">
            <span className="font-normal">Simple on the surface.</span>
            <span className="mt-1 block font-bold">Serious underneath.</span>
          </h2>
          <p className="mt-5 max-w-md text-pretty text-[13px] font-light leading-6 text-[#1c133b]/80 sm:max-w-[18rem] sm:leading-7">
            Customers should not need to understand marketplace mechanics.
            CleanScape keeps those details tidy in the background.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3 sm:gap-0">
          {steps.map((step, index) => (
            <div
              className={`text-center sm:px-5 lg:px-7 ${
                index > 0 ? "sm:border-l sm:border-[#1c133b]/12" : ""
              }`}
              key={step.title}
            >
              <div
                className="mx-auto flex size-[50px] items-center justify-center rounded-full text-white"
                style={{ backgroundColor: step.color }}
              >
                <step.icon className="size-[22px]" strokeWidth={1.75} />
              </div>
              <p className="mt-4 text-[16px] font-semibold text-[#1c133b]">
                {step.title}
              </p>
              <p className="mt-2 text-pretty text-[12px] font-light leading-[1.45] text-[#1c133b]/75">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </ScrollReveal>
  );
}
