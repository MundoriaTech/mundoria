import { MessageSquareQuote } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * “Read customer reviews” jump link, stacked in flow on mobile, top-right from sm up.
 * It deliberately shows no star rating or score: the only rating the site
 * shows is the live one from Google, in the reviews section it links to.
 */
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
      <MessageSquareQuote
        aria-hidden
        className="h-3.5 w-3.5 shrink-0 text-[#c79c66]"
      />
      <span className="min-w-0 underline underline-offset-2">
        Read customer reviews
      </span>
    </a>
  );
}
