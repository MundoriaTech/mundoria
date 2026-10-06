"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Star, X } from "lucide-react";

import type { GooglePlaceReviews } from "@/lib/google/place-reviews";
import { cn } from "@/lib/utils";

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 24 24">
      <path
        d="M21.6 12.23c0-.74-.07-1.45-.19-2.14H12v4.05h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.89-1.74 2.98-4.3 2.98-7.43Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.5c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.41 13.91A6.02 6.02 0 0 1 6.1 12c0-.66.11-1.3.31-1.91V7.5H3.07A10 10 0 0 0 2 12c0 1.61.39 3.14 1.07 4.5l3.34-2.59Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.97c1.47 0 2.79.5 3.83 1.5l2.87-2.87C16.95 2.99 14.7 2 12 2A10 10 0 0 0 3.07 7.5l3.34 2.59C7.2 7.73 9.4 5.97 12 5.97Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function Stars({
  className,
  rating,
}: {
  className?: string;
  rating: number;
}) {
  return (
    <span
      aria-label={`${rating.toFixed(1)} out of 5`}
      className={cn("inline-flex items-center", className)}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const fill = Math.max(0, Math.min(1, rating - index));
        return (
          <span className="relative h-3.5 w-3.5" key={index}>
            <Star
              className="absolute inset-0 h-3.5 w-3.5 text-[#e6e6e6]"
              fill="currentColor"
              strokeWidth={0}
            />
            <span
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star
                className="h-3.5 w-3.5 text-[#fbbc04]"
                fill="currentColor"
                strokeWidth={0}
              />
            </span>
          </span>
        );
      })}
    </span>
  );
}

function ReviewsPanel({
  data,
  onClose,
}: {
  data: GooglePlaceReviews;
  onClose: () => void;
}) {
  useEffect(() => {
    const previousBody = document.body.style.overflow;
    const previousHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousBody;
      document.documentElement.style.overflow = previousHtml;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[80]">
      <style>
        {`@keyframes mundoria-reviews-in{from{transform:translateX(100%)}to{transform:translateX(0)}}`}
      </style>
      <button
        aria-label="Close reviews"
        className="absolute inset-0 bg-[#1c133b]/40"
        onClick={onClose}
        type="button"
      />
      <aside
        aria-label="Google reviews"
        className="fixed inset-y-0 right-0 flex h-dvh w-full max-w-[26rem] flex-col bg-[#f8f9fa] shadow-[-16px_0_40px_rgba(28,19,59,0.2)]"
        role="dialog"
        style={{ animation: "mundoria-reviews-in 280ms ease-out" }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-black/5 bg-white px-5 py-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <GoogleMark className="h-5 w-5 shrink-0" />
              <p className="truncate text-sm font-semibold text-[#3c4043]">
                {data.name}
              </p>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <p className="text-2xl font-semibold tracking-[-0.03em] text-[#202124]">
                {data.rating.toFixed(1)}
              </p>
              <Stars rating={data.rating} />
            </div>
            <a
              className="mt-1 inline-block text-xs font-medium text-[#1a73e8]"
              href={data.listingUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              {data.reviewCount.toLocaleString("en-GB")} Google reviews
            </a>
          </div>
          <button
            aria-label="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#3c4043] transition hover:bg-[#f1f3f4]"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {data.reviews.map((review) => (
            <article
              className="rounded-2xl border border-black/5 bg-white p-4"
              key={review.id}
            >
              <div className="flex items-center gap-3">
                {review.photoUrl ? (
                  // Google hosts these author photos and they change with the listing.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    className="h-9 w-9 rounded-full object-cover"
                    src={review.photoUrl}
                  />
                ) : (
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#e8f0fe] text-sm font-semibold text-[#1a73e8]">
                    {review.author.slice(0, 1)}
                  </span>
                )}
                <div className="min-w-0">
                  {review.authorUrl ? (
                    <a
                      className="block truncate text-sm font-semibold text-[#202124]"
                      href={review.authorUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {review.author}
                    </a>
                  ) : (
                    <p className="truncate text-sm font-semibold text-[#202124]">
                      {review.author}
                    </p>
                  )}
                  <div className="mt-0.5 flex items-center gap-2">
                    <Stars rating={review.rating} />
                    {review.relativeTime ? (
                      <span className="text-xs text-[#70757a]">
                        {review.relativeTime}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              {review.text ? (
                <p className="mt-3 text-sm leading-6 text-[#3c4043]">
                  {review.text}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </aside>
    </div>,
    document.body,
  );
}

export function GoogleReviewsButton({ className }: { className?: string }) {
  const [data, setData] = useState<GooglePlaceReviews | null>(null);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/google-reviews")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { reviews?: GooglePlaceReviews | null } | null) => {
        if (!cancelled) setData(payload?.reviews ?? null);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) return null;

  return (
    <>
      <button
        aria-label={`Google reviews, ${data.rating.toFixed(1)} out of 5 from ${data.reviewCount} reviews`}
        className={cn(
          "inline-flex items-center gap-2.5 rounded-full border border-[#e4e4e4] bg-white px-3 py-2 text-left shadow-[0_8px_20px_rgba(32,33,36,0.08)] transition hover:bg-[#f8f9fa]",
          className,
        )}
        onClick={() => setOpen(true)}
        type="button"
      >
        <GoogleMark className="h-5 w-5 shrink-0" />
        <span className="flex flex-col">
          <Stars rating={data.rating} />
          <span className="mt-0.5 text-[11px] font-medium leading-4 text-[#5f6368]">
            {data.rating.toFixed(1)} · {data.reviewCount.toLocaleString("en-GB")}{" "}
            Google reviews
          </span>
        </span>
      </button>
      {open ? <ReviewsPanel data={data} onClose={close} /> : null}
    </>
  );
}
