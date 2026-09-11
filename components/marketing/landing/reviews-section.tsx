"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type AnimationEvent,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { LazyImage } from "@/components/shared/lazy-image";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import {
  landingReviewPlaceholders,
  type LandingReview,
} from "@/lib/marketing/landing-reviews";

const REVIEW_SMILEYS = {
  decorLeft: "/images/marketing/landing/happy_10760935 1.png",
  decorRightSmall: "/images/marketing/landing/smile_15604428 1.png",
  decorTopRight: "/images/marketing/landing/smiley_16301313 1.png",
  card: "/images/marketing/landing/smiley_16301313 1.png",
} as const;

const REVIEWS_SECTION_BG = "#F3F2FA";
const REVIEW_CARD_BG = "#ece3f9";

const CARD_SLOT_STYLES = [
  {
    accent: "#c79c66",
    accentHeight: 11,
    offsetClass: "md:translate-y-0",
  },
  {
    accent: "#733fb2",
    accentHeight: 14,
    offsetClass: "md:-translate-y-10",
  },
  {
    accent: "#e67248",
    accentHeight: 11,
    offsetClass: "md:translate-y-5",
  },
] as const;

const CARD_GAP = 20;
const DESKTOP_SET_SIZE = 3;
const AUTO_ADVANCE_HOLD_MS = 6500;
const DESKTOP_STAGE_MIN_HEIGHT = 330;

function ReviewCardAccent({
  color,
  height,
}: {
  color: string;
  height: number;
}) {
  const viewHeight = 12;

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 block w-full"
      height={height}
      preserveAspectRatio="none"
      viewBox={`0 0 248 ${viewHeight}`}
    >
      <path d="M0 12V9.5Q124 2.5 248 9.5V12H0Z" fill={color} />
    </svg>
  );
}

export type DesktopReviewCarouselHandle = {
  advance: () => void;
  isAnimating: () => boolean;
  retreat: () => void;
};

function ReviewCard({
  review,
  slotIndex,
}: {
  review: LandingReview;
  slotIndex: number;
}) {
  const slot = CARD_SLOT_STYLES[slotIndex % CARD_SLOT_STYLES.length];

  return (
    <article
      className={`relative flex min-h-[248px] w-full flex-col overflow-hidden rounded-[8px] shadow-[0_12px_32px_rgba(28,19,59,0.12)] md:min-h-[262px] md:shadow-[0_14px_36px_rgba(28,19,59,0.14)] ${slot.offsetClass}`}
      style={{ backgroundColor: REVIEW_CARD_BG }}
    >
      <div className="flex flex-1 flex-col px-6 pb-5 pt-7">
        <div className="flex items-start justify-between gap-3">
          <p
            aria-hidden
            className="text-[11px] tracking-[0.18em] text-[#c79c66]"
          >
            ★★★★★
          </p>
          <LazyImage
            alt=""
            className="shrink-0"
            height={36}
            src={REVIEW_SMILEYS.card}
            width={36}
          />
        </div>
        <p className="mt-4 flex-1 text-[12px] font-light leading-[17px] text-black">
          “{review.quote}”
        </p>
        <div className="mt-6 pb-1">
          <p className="text-[10px] font-semibold leading-[17px] text-black">
            {review.name}
          </p>
          <p className="text-[8px] font-light leading-none text-black">
            {review.detail}
          </p>
        </div>
      </div>
      <ReviewCardAccent color={slot.accent} height={slot.accentHeight} />
    </article>
  );
}

function getVisibleReviews(reviews: LandingReview[], startIndex: number) {
  if (reviews.length === 0) return [];

  return Array.from({ length: Math.min(3, reviews.length) }, (_, slot) => {
    return reviews[(startIndex + slot) % reviews.length];
  });
}

function ReviewSetGrid({
  reviews,
  startIndex,
}: {
  reviews: LandingReview[];
  startIndex: number;
}) {
  const visibleReviews = getVisibleReviews(reviews, startIndex);

  return (
    <div className="grid grid-cols-3 items-start gap-6">
      {visibleReviews.map((review, slotIndex) => (
        <ReviewCard
          key={`${review.id}-${slotIndex}`}
          review={review}
          slotIndex={slotIndex}
        />
      ))}
    </div>
  );
}

function ReviewCarouselStage({
  animateClassName,
  "aria-hidden": ariaHidden,
  className,
  onAnimationEnd,
  reviews,
  startIndex,
}: {
  animateClassName?: string;
  "aria-hidden"?: boolean;
  className?: string;
  onAnimationEnd?: (event: AnimationEvent<HTMLDivElement>) => void;
  reviews: LandingReview[];
  startIndex: number;
}) {
  return (
    <div
      aria-hidden={ariaHidden}
      className={`absolute inset-x-0 top-0 pt-10 ${animateClassName ?? ""} ${className ?? ""}`}
      style={{ backgroundColor: REVIEWS_SECTION_BG }}
      onAnimationEnd={onAnimationEnd}
    >
      <ReviewSetGrid reviews={reviews} startIndex={startIndex} />
    </div>
  );
}

const DesktopReviewCarousel = forwardRef<
  DesktopReviewCarouselHandle,
  {
    onAnimatingChange?: (isAnimating: boolean) => void;
    reviews: LandingReview[];
  }
>(function DesktopReviewCarousel({ onAnimatingChange, reviews }, ref) {
  const displayIndexRef = useRef(0);
  const incomingIndexRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);
  const advanceRef = useRef<() => void>(() => {});
  const autoAdvanceTimeoutRef = useRef<number | null>(null);

  const [displayIndex, setDisplayIndex] = useState(0);
  const [incomingIndex, setIncomingIndex] = useState<number | null>(null);

  const canAdvance = reviews.length > DESKTOP_SET_SIZE;

  useEffect(() => {
    displayIndexRef.current = displayIndex;
  }, [displayIndex]);

  useEffect(() => {
    incomingIndexRef.current = incomingIndex;
  }, [incomingIndex]);

  function clearAutoAdvance() {
    if (autoAdvanceTimeoutRef.current !== null) {
      window.clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
  }

  const scheduleAutoAdvance = useCallback(() => {
    clearAutoAdvance();

    if (!canAdvance) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(max-width: 767px)").matches) return;

    autoAdvanceTimeoutRef.current = window.setTimeout(() => {
      advanceRef.current();
    }, AUTO_ADVANCE_HOLD_MS);
  }, [canAdvance]);

  const navigateTo = useCallback(
    (targetIndex: number) => {
      if (!canAdvance || isAnimatingRef.current) return;
      if (targetIndex === displayIndexRef.current) return;

      clearAutoAdvance();

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setDisplayIndex(targetIndex);
        scheduleAutoAdvance();
        return;
      }

      isAnimatingRef.current = true;
      onAnimatingChange?.(true);
      setIncomingIndex(targetIndex);
    },
    [canAdvance, onAnimatingChange, scheduleAutoAdvance],
  );

  const advance = useCallback(() => {
    const nextIndex =
      (displayIndexRef.current + DESKTOP_SET_SIZE) % reviews.length;
    navigateTo(nextIndex);
  }, [navigateTo, reviews.length]);

  const retreat = useCallback(() => {
    const previousIndex =
      (displayIndexRef.current - DESKTOP_SET_SIZE + reviews.length) %
      reviews.length;
    navigateTo(previousIndex);
  }, [navigateTo, reviews.length]);

  useEffect(() => {
    advanceRef.current = advance;
  }, [advance]);

  useImperativeHandle(
    ref,
    () => ({
      advance,
      isAnimating: () => isAnimatingRef.current,
      retreat,
    }),
    [advance, retreat],
  );

  useEffect(() => {
    if (incomingIndex !== null) return;

    scheduleAutoAdvance();
    return clearAutoAdvance;
  }, [displayIndex, incomingIndex, scheduleAutoAdvance]);

  function finishTransition(event: AnimationEvent<HTMLDivElement>) {
    if (event.animationName !== "reviews-carousel-enter") return;
    if (incomingIndexRef.current === null) return;

    setDisplayIndex(incomingIndexRef.current);
    setIncomingIndex(null);
    isAnimatingRef.current = false;
    onAnimatingChange?.(false);
  }

  return (
    <div
      className="relative hidden pb-2 md:block"
      style={{ minHeight: DESKTOP_STAGE_MIN_HEIGHT }}
    >
      {incomingIndex === null ? (
        <ReviewCarouselStage reviews={reviews} startIndex={displayIndex} />
      ) : (
        <>
          <ReviewCarouselStage
            animateClassName="reviews-carousel-exit motion-reduce:animate-none motion-reduce:opacity-0"
            aria-hidden
            reviews={reviews}
            startIndex={displayIndex}
          />
          <ReviewCarouselStage
            animateClassName="reviews-carousel-enter motion-reduce:animate-none motion-reduce:opacity-100"
            className="z-10"
            onAnimationEnd={finishTransition}
            reviews={reviews}
            startIndex={incomingIndex}
          />
        </>
      )}
    </div>
  );
});

export function ReviewsSection({
  reviews = landingReviewPlaceholders,
}: {
  reviews?: LandingReview[];
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const desktopCarouselRef = useRef<DesktopReviewCarouselHandle>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  function scrollMobile(direction: "left" | "right") {
    const node = scrollerRef.current;
    if (!node) return;

    const cardWidth = node.querySelector("article")?.clientWidth ?? 300;
    node.scrollBy({
      behavior: "smooth",
      left: direction === "right" ? cardWidth + CARD_GAP : -(cardWidth + CARD_GAP),
    });
  }

  function goToNext() {
    if (window.matchMedia("(max-width: 767px)").matches) {
      scrollMobile("right");
      return;
    }

    if (desktopCarouselRef.current?.isAnimating()) return;

    desktopCarouselRef.current?.advance();
  }

  function goToPrevious() {
    if (window.matchMedia("(max-width: 767px)").matches) {
      scrollMobile("left");
      return;
    }

    if (desktopCarouselRef.current?.isAnimating()) return;

    desktopCarouselRef.current?.retreat();
  }

  return (
    <section
      className="overflow-x-clip px-4 py-14 sm:px-8 sm:py-20"
      id="reviews"
      style={{ backgroundColor: REVIEWS_SECTION_BG }}
    >
      <div className="mx-auto max-w-6xl">
        <ScrollReveal className="relative mx-auto flex min-h-[72px] max-w-[720px] flex-col items-center justify-center px-2 text-center sm:min-h-[96px] sm:px-16">
          <LazyImage
            alt=""
            className="absolute right-0 top-0 hidden sm:block"
            height={47}
            src={REVIEW_SMILEYS.decorTopRight}
            width={47}
          />
          <LazyImage
            alt=""
            className="absolute left-0 top-[38%] hidden sm:block"
            height={44}
            src={REVIEW_SMILEYS.decorLeft}
            width={44}
          />
          <LazyImage
            alt=""
            className="absolute bottom-2 right-[22%] hidden sm:block"
            height={30}
            src={REVIEW_SMILEYS.decorRightSmall}
            width={30}
          />

          <h2 className="max-w-[20rem] text-balance text-[1.5rem] font-semibold leading-[1.1] tracking-[-0.03em] text-[#1c133b] sm:max-w-none sm:text-[36px] sm:leading-[1.08]">
            What our customers say
          </h2>
        </ScrollReveal>

        <div className="mt-8 md:mt-14">
          <div className="hidden md:flex md:items-center md:gap-3 lg:gap-4">
            {reviews.length > DESKTOP_SET_SIZE ? (
              <button
                aria-label="Previous reviews"
                className="flex size-[31px] shrink-0 items-center justify-center rounded-full bg-[#d9d9d9] text-[#414141] transition hover:bg-[#cfcfcf] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isAnimating}
                onClick={goToPrevious}
                type="button"
              >
                <ChevronLeft className="size-4" />
              </button>
            ) : null}

            <div className="min-w-0 flex-1">
              <DesktopReviewCarousel
                onAnimatingChange={setIsAnimating}
                ref={desktopCarouselRef}
                reviews={reviews}
              />
            </div>

            {reviews.length > DESKTOP_SET_SIZE ? (
              <button
                aria-label="Next reviews"
                className="flex size-[31px] shrink-0 items-center justify-center rounded-full bg-[#d9d9d9] text-[#414141] transition hover:bg-[#cfcfcf] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isAnimating}
                onClick={goToNext}
                type="button"
              >
                <ChevronRight className="size-4" />
              </button>
            ) : null}
          </div>

          <div className="md:hidden">
            <div
              className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              ref={scrollerRef}
            >
              {reviews.map((review, index) => (
                <div
                  className="w-[min(78vw,280px)] shrink-0 snap-start"
                  key={review.id}
                >
                  <ReviewCard review={review} slotIndex={index % 3} />
                </div>
              ))}
            </div>

            {reviews.length > DESKTOP_SET_SIZE ? (
              <div className="mt-5 flex justify-end gap-2">
                <button
                  aria-label="Previous reviews"
                  className="flex size-11 items-center justify-center rounded-full bg-[#d9d9d9] text-[#414141] transition hover:bg-[#cfcfcf] disabled:cursor-not-allowed disabled:opacity-50 sm:size-[31px]"
                  disabled={isAnimating}
                  onClick={goToPrevious}
                  type="button"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  aria-label="Next reviews"
                  className="flex size-11 items-center justify-center rounded-full bg-[#d9d9d9] text-[#414141] transition hover:bg-[#cfcfcf] disabled:cursor-not-allowed disabled:opacity-50 sm:size-[31px]"
                  disabled={isAnimating}
                  onClick={goToNext}
                  type="button"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
