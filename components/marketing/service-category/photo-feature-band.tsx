import Image from "next/image";

const CARDS = [
  {
    body: "Book online with a clear estimate — no agency middlemen or cash-in-hand ambiguity.",
    image: "/images/marketing/landing/feature-efficient.png",
    imageClass: "bottom-0 left-1/2 w-[120%] max-w-none -translate-x-1/2",
    surface: "bg-[#e4d4f4] text-[#1c133b]",
    title: "We're efficient",
  },
  {
    body: "Change, cancel or reschedule in your account before the fee window — life happens.",
    image: "/images/marketing/landing/feature-flexible.png",
    imageClass: "bottom-[-4%] left-1/2 w-[94%] max-w-none -translate-x-1/2",
    surface: "bg-[#6f4fa3] text-white",
    title: "We're flexible",
  },
  {
    body: "Regular, deep, moving, short-let and Recovery cleans tailored to your space.",
    image: "/images/marketing/landing/feature-accessible.png",
    imageClass: "bottom-0 left-1/2 w-[112%] max-w-none -translate-x-1/2",
    surface: "bg-[#2a1b4a] text-[#e8d9f5]",
    title: "We're accessible",
  },
] as const;

export function PhotoFeatureBand() {
  return (
    <section
      className="px-4 py-10 sm:px-8 sm:py-12"
      style={{
        backgroundImage:
          "linear-gradient(180deg, #f3eef8 0%, #f7f2fc 45%, #faf8ff 100%)",
      }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-3 sm:grid-cols-3 sm:gap-3.5">
          {CARDS.map(({ body, image, imageClass, surface, title }) => (
            <article
              className={`relative flex min-h-[24rem] flex-col overflow-hidden rounded-[1.35rem] px-5 pt-6 sm:min-h-[27rem] sm:rounded-[1.5rem] sm:px-6 sm:pt-7 ${surface}`}
              key={title}
            >
              <h3 className="relative z-10 text-[1.4rem] font-bold leading-tight tracking-[-0.03em] sm:text-[1.55rem]">
                {title}
              </h3>
              <p className="relative z-10 mt-3 max-w-[15.5rem] text-[13px] font-normal leading-[1.45] opacity-95 sm:text-[14px] sm:leading-[1.5]">
                {body}
              </p>
              <div className="relative mt-auto min-h-[13rem] flex-1 sm:min-h-[15rem]">
                <Image
                  alt=""
                  aria-hidden
                  className={`pointer-events-none absolute object-contain object-bottom ${imageClass}`}
                  height={720}
                  sizes="(min-width: 640px) 30vw, 90vw"
                  src={image}
                  width={560}
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
