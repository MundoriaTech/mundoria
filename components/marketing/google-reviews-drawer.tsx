"use client";

import { useEffect, useState } from "react";
import { Star, X } from "lucide-react";

import { landingReviewPlaceholders } from "@/lib/marketing/landing-reviews";
import { cn } from "@/lib/utils";

export type GoogleReviewItem = {
  detail: string;
  id: string;
  name: string;
  quote: string;
};

export function GoogleReviewsButton({
  className,
  reviews = landingReviewPlaceholders,
}: {
  className?: string;
  reviews?: GoogleReviewItem[];
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        className={cn(
          "text-sm font-semibold text-[#312c79] underline decoration-[#312c79]/40 underline-offset-4 transition hover:decoration-[#312c79]",
          className,
        )}
        onClick={() => setOpen(true)}
        type="button"
      >
        Google reviews
      </button>
      {open ? (
        <div className="fixed inset-0 z-[80]">
          <button
            aria-label="Close reviews"
            className="absolute inset-0 bg-[#1c133b]/40"
            onClick={() => setOpen(false)}
            type="button"
          />
          <aside
            aria-label="Google reviews"
            className="absolute inset-y-0 right-0 flex w-[min(26rem,100%)] flex-col bg-[#f7f6f8] shadow-[-16px_0_40px_rgba(28,19,59,0.18)]"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#e4daf5] bg-white px-5 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#823fb2]">
                  Mundoria
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#1c133b]">
                  Google reviews
                </h2>
              </div>
              <button
                aria-label="Close"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#1c133b] transition hover:bg-[#f3f4f6]"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {reviews.map((review) => (
                <article
                  className="rounded-[1.15rem] border border-[#e4daf5]/80 bg-white p-4"
                  key={review.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[#1c133b]">{review.name}</p>
                    <span className="inline-flex text-[#c79c66]" aria-hidden>
                      {Array.from({ length: 5 }, (_, index) => (
                        <Star
                          className="h-3.5 w-3.5 fill-current"
                          key={index}
                          strokeWidth={0}
                        />
                      ))}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-[#823fb2]">
                    {review.detail}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#3d3a48]">
                    {review.quote}
                  </p>
                </article>
              ))}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
