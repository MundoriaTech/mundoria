import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/** Stars + “Check reviews” — stacked in flow on mobile, top-right from sm up. */
export function HeroReviewsLink({
  className,
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <a
      className={cn(
        "mb-3 inline-flex max-w-full flex-wrap items-center gap-1.5 text-[12px] font-medium transition sm:absolute sm:right-0 sm:top-0 sm:z-10 sm:mb-0 sm:text-[13px]",
        tone === "light"
          ? "text-white/95 hover:text-white"
          : "text-[#1c133b]/85 hover:text-[#1c133b]",
        className,
      )}
      href="#reviews"
    >
      <span className="inline-flex shrink-0 text-[#c79c66]" aria-hidden>
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            className="h-3.5 w-3.5 fill-current"
            key={index}
            strokeWidth={0}
          />
        ))}
      </span>
      <span className="min-w-0">
        4.8/5{" "}
        <span className="underline underline-offset-2">Check reviews</span>
      </span>
    </a>
  );
}
