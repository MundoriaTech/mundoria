"use client";

import { Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  GoogleReviewsButton,
  useGoogleReviews,
} from "@/components/marketing/google-reviews-drawer";
import type { LandingReview } from "@/lib/marketing/landing-reviews";
import { cn } from "@/lib/utils";

const ROTATE_MS = 4000;
const VISIBLE_STACK = 3;

/** Opacity only — no movement, so reading stays easy. */
const REVIEW_MOTION = "dissolve" as ReviewMotion;

type ReviewMotion = "crossfade" | "dissolve" | "rise" | "slide" | "stagger";

const MOTION_CLASS: Record<
  ReviewMotion,
  { in: string; out: string; stagger?: boolean }
> = {
  crossfade: {
    in: "reviews-motion-crossfade-in",
    out: "reviews-motion-crossfade-out",
  },
  dissolve: {
    in: "reviews-motion-dissolve-in",
    out: "reviews-motion-dissolve-out",
  },
  rise: {
    in: "reviews-motion-rise-in",
    out: "reviews-motion-rise-out",
  },
  slide: {
    in: "reviews-motion-slide-in",
    out: "reviews-motion-slide-out",
  },
  stagger: {
    in: "reviews-motion-stagger-in",
    out: "reviews-motion-stagger-out",
    stagger: true,
  },
};

function QuoteMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={cn("text-[#6a45b8]", className)}
      fill="currentColor"
      height="48"
      viewBox="0 0 64 48"
      width="64"
    >
      <path d="M12.8 48C7.2 48 2.8 43.4 2.8 37.4 2.8 24.6 11.6 12.8 26 4.8L30.4 11.2C20.8 17.2 15.6 24.2 15.6 31.4c0 2.2.6 4 1.8 5.4 1.4-1 3.2-1.6 5.2-1.6 5 0 8.8 3.6 8.8 8.6S27.6 48 22.6 48h-9.8zm30.4 0c-5.6 0-10-4.6-10-10.6 0-12.8 8.8-24.6 23.2-32.6L61 11.2C51.4 17.2 46.2 24.2 46.2 31.4c0 2.2.6 4 1.8 5.4 1.4-1 3.2-1.6 5.2-1.6 5 0 8.8 3.6 8.8 8.6S63.6 48 58.6 48H43.2z" />
    </svg>
  );
}

function ReviewStars({ score }: { score: number | null | undefined }) {
  if (score == null || score <= 0) return null;
  return (
    <span
      aria-label={`${score.toFixed(1)} out of 5`}
      className="inline-flex gap-0.5 text-[#c79c66]"
    >
      {Array.from({ length: 5 }, (_, index) => {
        const fill = Math.max(0, Math.min(1, score - index));
        return (
          <span className="relative size-3.5" key={index}>
            <Star
              aria-hidden
              className="absolute inset-0 size-3.5 text-[#e8e0d4]"
              fill="currentColor"
              strokeWidth={0}
            />
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 overflow-hidden text-[#c79c66]"
              style={{ width: `${fill * 100}%` }}
            >
              <Star className="size-3.5" fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

function FeaturedReview({ review }: { review: LandingReview }) {
  return (
    <div className="max-w-xl">
      <QuoteMark className="h-10 w-14 sm:h-12 sm:w-[4.25rem]" />
      <div className="mt-5">
        <ReviewStars score={review.rating} />
      </div>
      <p className="mt-3 text-[1.15rem] font-medium leading-[1.45] tracking-[-0.015em] text-[#1c133b] sm:text-[1.35rem] sm:leading-[1.4]">
        “{review.quote}”
      </p>
      <p className="mt-8 text-base font-semibold text-[#1c133b]">{review.name}</p>
      {review.detail ? (
        <p className="mt-1 text-sm text-[#6b6578]">{review.detail}</p>
      ) : null}
    </div>
  );
}

function StackedReview({
  review,
  showRule,
}: {
  review: LandingReview;
  showRule: boolean;
}) {
  return (
    <article className={cn(showRule && "border-t border-[#e6e1ee] pt-6")}>
      <ReviewStars score={review.rating} />
      <p className="mt-2 text-[0.98rem] leading-7 text-[#1c133b] sm:text-[1.05rem] sm:leading-7">
        “{review.quote}”
      </p>
      <p className="mt-4 text-sm font-semibold text-[#1c133b]">{review.name}</p>
      {review.detail ? (
        <p className="mt-0.5 text-sm text-[#6b6578]">{review.detail}</p>
      ) : null}
    </article>
  );
}

function uniqueReviews(reviews: LandingReview[]) {
  const unique: LandingReview[] = [];
  const seen = new Set<string>();
  for (const review of reviews) {
    const key = review.quote.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(review);
  }
  return unique;
}

function windowAt(reviews: LandingReview[], offset: number) {
  const count = reviews.length;
  if (!count) {
    return { featured: null as LandingReview | null, stacked: [] as LandingReview[] };
  }
  const featured = reviews[offset % count]!;
  const stacked: LandingReview[] = [];
  for (let i = 1; i <= Math.min(VISIBLE_STACK, count - 1); i += 1) {
    stacked.push(reviews[(offset + i) % count]!);
  }
  return { featured, stacked };
}

function ReviewWindow({
  enter,
  featured,
  motion,
  stacked,
}: {
  enter: boolean;
  featured: LandingReview;
  motion: ReviewMotion;
  stacked: LandingReview[];
}) {
  const classes = MOTION_CLASS[motion];
  const phase = enter ? classes.in : classes.out;

  if (classes.stagger) {
    return (
      <div className="grid gap-12 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:items-start md:gap-14 lg:gap-20">
        <div
          className={phase}
          style={enter ? { animationDelay: "0ms" } : undefined}
        >
          <FeaturedReview review={featured} />
        </div>
        <div className="flex flex-col gap-6">
          {stacked.map((review, index) => (
            <div
              className={phase}
              key={review.id}
              style={
                enter ? { animationDelay: `${120 + index * 90}ms` } : undefined
              }
            >
              <StackedReview review={review} showRule={index > 0} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-12 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:items-start md:gap-14 lg:gap-20", phase)}>
      <FeaturedReview review={featured} />
      <div className="flex flex-col gap-6">
        {stacked.map((review, index) => (
          <StackedReview
            key={review.id}
            review={review}
            showRule={index > 0}
          />
        ))}
      </div>
    </div>
  );
}

export function ReviewsSection({
  heading = "Cleaning reviews in Birmingham",
  reviews: ownReviews = [],
}: {
  heading?: string;
  reviews?: LandingReview[];
}) {
  // Reviews from completed bookings come first. Until there are some, show
  // the real reviews from the Mundoria Google listing, credited to Google.
  const { data: google } = useGoogleReviews();
  const reviews = ownReviews.length
    ? ownReviews
    : (google?.reviews ?? [])
        .filter((review) => review.text)
        .map((review) => ({
          detail: review.relativeTime
            ? `Google review · ${review.relativeTime}`
            : "Google review",
          id: review.id,
          name: review.author,
          quote: review.text,
          rating: review.rating,
        }));

  const unique = uniqueReviews(reviews);
  const canRotate = unique.length > 1;

  const [offset, setOffset] = useState(0);
  const [paused, setPaused] = useState(false);
  // Keep the outgoing set briefly so enter/exit can overlap (true crossfade).
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const offsetRef = useRef(offset);
  offsetRef.current = offset;

  useEffect(() => {
    if (!canRotate || paused) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      const current = offsetRef.current;
      setOutgoing(current);
      setOffset((current + 1) % unique.length);
    }, ROTATE_MS);

    return () => window.clearInterval(timer);
  }, [canRotate, paused, unique.length]);

  useEffect(() => {
    if (outgoing == null) return;
    const clear = window.setTimeout(() => setOutgoing(null), 520);
    return () => window.clearTimeout(clear);
  }, [outgoing]);

  const incoming = windowAt(unique, offset);
  const leaving =
    outgoing == null ? null : windowAt(unique, outgoing);

  return (
    <section className="bg-white px-4 py-14 sm:px-8 sm:py-20" id="reviews">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-[1.65rem] font-semibold leading-[1.15] tracking-[-0.03em] text-[#1c133b] sm:text-[1.9rem] lg:text-[2.1rem]">
            {heading}
          </h2>
          <div className="mt-5 flex justify-center">
            <GoogleReviewsButton />
          </div>
        </div>

        {incoming.featured ? (
          <div
            className="relative mt-10 md:mt-12"
            onBlurCapture={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {leaving?.featured ? (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0"
                key={`out-${outgoing}`}
              >
                <ReviewWindow
                  enter={false}
                  featured={leaving.featured}
                  motion={REVIEW_MOTION}
                  stacked={leaving.stacked}
                />
              </div>
            ) : null}
            <div key={`in-${offset}`}>
              <ReviewWindow
                enter
                featured={incoming.featured}
                motion={REVIEW_MOTION}
                stacked={incoming.stacked}
              />
            </div>
          </div>
        ) : (
          <p className="mt-6 max-w-xl text-sm leading-6 text-[#5a5470]">
            We only publish reviews written by customers after a completed
            booking, or reviews left on our Google listing.
          </p>
        )}
      </div>
    </section>
  );
}
