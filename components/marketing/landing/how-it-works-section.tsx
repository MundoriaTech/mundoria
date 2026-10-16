import { ScrollReveal } from "@/components/shared/scroll-reveal";

const cards = [
  {
    body: "From booking and matching to updates and payment, Mundoria keeps the important parts connected so you do not have to piece everything together yourself.",
    illustration: <ConnectedIllustration />,
    title: "Less to manage",
  },
  {
    body: "We estimate the time your clean is likely to need and show you what you are paying for before you book. Clear, understandable and without unnecessary surprises.",
    illustration: <PricingIllustration />,
    title: "No mystery pricing",
  },
  {
    body: "We consider the service, location, timing, preferences and the professional’s experience to help arrange a booking that makes practical sense.",
    illustration: <BookingIllustration />,
    title: "More thought behind the booking",
  },
] as const;

export function HowItWorksSection() {
  return (
    <ScrollReveal
      as="section"
      className="bg-[#f5f4f6] px-4 py-16 sm:px-8 sm:py-24"
      id="how-it-works"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-[13px] font-medium uppercase tracking-[0.28em] text-[#c79c66] sm:text-sm">
          Why Mundoria works
        </p>
        <h2 className="mt-5 max-w-[16rem] text-[1.9rem] font-medium leading-[1.12] tracking-[-0.03em] text-[#1c133b] sm:max-w-none sm:text-[3.05rem]">
          A better way to get it sorted
        </h2>

        <div className="mt-10 grid gap-4 lg:grid-cols-3 lg:gap-5">
          {cards.map((card) => (
            <article
              className="grid grid-cols-[minmax(0,1fr)_5.4rem] gap-x-4 rounded-[22px] border border-[#efe6d6] bg-[#fbf7f0] px-5 py-6 sm:px-6 sm:py-7"
              key={card.title}
            >
              <h3 className="text-[1.05rem] font-semibold leading-snug tracking-[-0.02em] text-[#1c133b]">
                {card.title}
              </h3>
              <div className="row-span-2 self-start justify-self-end">
                {card.illustration}
              </div>
              <p className="mt-3 text-pretty text-[13.5px] font-light leading-6 text-[#3d3650]">
                {card.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </ScrollReveal>
  );
}

function Sparkle({ className }: { className?: string }) {
  return (
    <g className={className}>
      <path
        d="M8 0.8 9.1 5.2 13.5 6.3 9.1 7.4 8 11.8 6.9 7.4 2.5 6.3 6.9 5.2Z"
        fill="#1c133b"
      />
      <path
        d="M16.5 3.2h3.2M18.1 1.6v3.2"
        fill="none"
        stroke="#1c133b"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
    </g>
  );
}

function ConnectedIllustration() {
  return (
    <svg aria-hidden className="h-[5.4rem] w-[5.4rem]" viewBox="0 0 120 120">
      <ellipse cx="64" cy="64" fill="#efe6f8" rx="34" ry="32" />
      <g transform="translate(78 8)">
        <Sparkle />
      </g>
      <rect
        fill="#fff"
        height="62"
        rx="8"
        stroke="#1c133b"
        strokeWidth="2.2"
        width="34"
        x="52"
        y="28"
      />
      <rect fill="#1c133b" height="3" rx="1.5" width="12" x="63" y="33" />
      <rect
        fill="#fff"
        height="18"
        rx="4"
        stroke="#1c133b"
        strokeWidth="1.7"
        width="40"
        x="18"
        y="42"
      />
      <path
        d="M24 48h16M24 54h22"
        fill="none"
        stroke="#c79c66"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
      <rect
        fill="#fff"
        height="18"
        rx="4"
        stroke="#1c133b"
        strokeWidth="1.7"
        width="36"
        x="24"
        y="64"
      />
      <path
        d="M30 70h14M30 76h20"
        fill="none"
        stroke="#6a45b8"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
      <path
        d="M30 96c14 12 36 10 48-8"
        fill="none"
        stroke="#c79c66"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M74 84l6 4-7 1"
        fill="none"
        stroke="#c79c66"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function PricingIllustration() {
  return (
    <svg aria-hidden className="h-[5.4rem] w-[5.4rem]" viewBox="0 0 120 120">
      <g transform="translate(78 6)">
        <Sparkle />
      </g>
      <circle
        cx="54"
        cy="58"
        fill="#efe6f8"
        r="30"
        stroke="#1c133b"
        strokeWidth="2.4"
      />
      <circle cx="54" cy="58" fill="#1c133b" r="2.2" />
      <path
        d="M54 42v16l12 8"
        fill="none"
        stroke="#1c133b"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
      <circle cx="82" cy="82" fill="#c79c66" r="16" />
      <text
        fill="#fff"
        fontFamily="inherit"
        fontSize="16"
        fontWeight="700"
        textAnchor="middle"
        x="82"
        y="88"
      >
        £
      </text>
    </svg>
  );
}

function BookingIllustration() {
  return (
    <svg aria-hidden className="h-[5.4rem] w-[5.4rem]" viewBox="0 0 120 120">
      <g transform="translate(86 4)">
        <Sparkle />
      </g>
      <rect
        fill="#fff"
        height="46"
        rx="8"
        stroke="#1c133b"
        strokeWidth="2"
        width="62"
        x="16"
        y="22"
      />
      <circle
        cx="36"
        cy="40"
        fill="#efe6f8"
        r="9"
        stroke="#1c133b"
        strokeWidth="1.6"
      />
      <circle cx="36" cy="37.5" fill="#1c133b" r="2.4" />
      <path
        d="M30.5 46.5c1.4-2.6 3.2-3.8 5.5-3.8s4.1 1.2 5.5 3.8"
        fill="none"
        stroke="#1c133b"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <path
        d="M52 36h18M52 43h14"
        fill="none"
        stroke="#c79c66"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
      <path
        d="M78 78c8 14 4 24-8 28"
        fill="none"
        stroke="#1c133b"
        strokeDasharray="2.4 3.2"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
      <path
        d="M70 96c0-7 4.2-12.5 9.4-12.5S89 89 89 96c0 6.2-9.4 14-9.4 14S70 102.2 70 96Z"
        fill="#c79c66"
        stroke="#1c133b"
        strokeWidth="1.6"
      />
      <circle cx="79.4" cy="95.5" fill="#fff" r="2.4" />
    </svg>
  );
}
