import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type MarketingFaqColumnItem = {
  answer: ReactNode;
  question: string;
};

export function MarketingFaqColumnsSection({
  footer,
  items,
  title,
  variant = "brand",
}: {
  footer?: ReactNode;
  items: MarketingFaqColumnItem[];
  title: string;
  /** `service` matches WeCasa subcategory FAQ cards: white tiles on a light wash. */
  variant?: "brand" | "service";
}) {
  const service = variant === "service";

  return (
    <section
      className={cn(
        "px-4 py-12 sm:px-8 sm:py-16",
        service ? "bg-[#f7f7f8]" : "bg-[#f3eef8]",
      )}
    >
      <div className="mx-auto max-w-6xl">
        <h2
          className={cn(
            "text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] sm:text-2xl lg:text-[1.75rem]",
            service ? "text-brand-ink" : "text-[#c45c3a]",
          )}
        >
          {title}
        </h2>
        <div
          className={cn(
            "mt-8 gap-4 sm:gap-5",
            service
              ? "grid sm:grid-cols-2 lg:grid-cols-3"
              : "columns-1 sm:columns-2",
          )}
        >
          {items.map((faq) => (
            <article
              className={cn(
                "rounded-[1.35rem] border px-5 py-5 sm:rounded-[1.5rem] sm:px-6 sm:py-6",
                service
                  ? "border-[#e6e6ea] bg-white"
                  : "mb-4 break-inside-avoid border-[#d8d4e0] bg-[#f7f6f8] sm:mb-5",
              )}
              key={faq.question}
            >
              <h3 className="text-[15px] font-bold leading-snug text-brand-ink sm:text-base">
                {faq.question}
              </h3>
              <div className="mt-2.5 text-sm font-normal leading-6 text-[#414141] sm:text-[15px] sm:leading-7 [&_a]:font-semibold [&_a]:text-brand-purple [&_a]:underline-offset-2 [&_a]:hover:underline [&_ul]:mt-2.5 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
                {faq.answer}
              </div>
            </article>
          ))}
        </div>
        {footer ? (
          <div className="mt-8 text-sm leading-6 text-[#414141] sm:mt-10">
            {footer}
          </div>
        ) : null}
      </div>
    </section>
  );
}
