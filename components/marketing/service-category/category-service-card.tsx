"use client";

import Link from "next/link";
import { useState } from "react";

import { LazyImage } from "@/components/shared/lazy-image";
import { marketingServiceBySlug } from "@/lib/seo/marketing";
import { cn } from "@/lib/utils";

const overlayLinkClass =
  "inline-flex h-9 items-center justify-center rounded-full px-3.5 text-[13px] font-semibold transition";

export function CategoryServiceCard({
  bookingHref,
  className,
  href,
  image,
  label,
  objectPosition = "object-center",
  sizes,
}: {
  bookingHref: string;
  className?: string;
  href: string;
  image: string;
  label: string;
  objectPosition?: string;
  sizes: string;
}) {
  const slug = href.replace(/^\/cleaning\//, "").split("/")[0] ?? "";
  const service = marketingServiceBySlug(slug);
  const bookHref =
    bookingHref === "/setup" || !service ? bookingHref : service.bookingHref;
  const [open, setOpen] = useState(false);

  return (
    <article
      className={cn(
        "group flex w-[min(72vw,15rem)] max-w-[16.25rem] shrink-0 snap-start flex-col overflow-hidden rounded-[1.25rem] bg-white shadow-[0_12px_32px_rgba(28,19,59,0.12)] transition duration-300 [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:shadow-[0_16px_36px_rgba(28,19,59,0.16)] sm:w-[15.5rem] md:w-[16.25rem] xl:max-w-none xl:w-[calc((100%-3.75rem)/4)]",
        className,
      )}
      onClick={(event) => {
        if (window.matchMedia("(hover: hover)").matches) return;
        if ((event.target as HTMLElement).closest("a")) return;
        setOpen((value) => !value);
      }}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#f4ebfe]">
        <LazyImage
          alt={label}
          className={cn(
            "object-cover transition duration-500 [@media(hover:hover)]:group-hover:scale-[1.03]",
            objectPosition,
          )}
          fill
          sizes={sizes}
          src={image}
        />
        <button
          aria-expanded={open}
          aria-label={`Show options for ${label}`}
          className={cn(
            "absolute inset-0 z-[1] [@media(hover:hover)]:hidden",
            open && "hidden",
          )}
          onClick={(event) => {
            event.stopPropagation();
            setOpen(true);
          }}
          type="button"
        />
        <div
          className={cn(
            "absolute inset-0 z-[2] flex items-center justify-center gap-2 bg-brand-ink/55 px-3 transition duration-300",
            open
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0 [@media(hover:none)]:group-focus-within:pointer-events-auto [@media(hover:none)]:group-focus-within:opacity-100",
            "[@media(hover:hover)]:pointer-events-none [@media(hover:hover)]:opacity-0",
            "[@media(hover:hover)]:group-hover:pointer-events-auto [@media(hover:hover)]:group-hover:opacity-100",
            "[@media(hover:hover)]:group-focus-within:pointer-events-auto [@media(hover:hover)]:group-focus-within:opacity-100",
          )}
        >
          <Link
            aria-label={`Read more about ${label}`}
            className={cn(
              overlayLinkClass,
              "border border-white text-white hover:bg-white hover:text-brand-ink",
            )}
            href={href}
          >
            Read more
          </Link>
          <Link
            aria-label={`Book ${label}`}
            className={cn(
              overlayLinkClass,
              "hidden bg-white text-brand-ink hover:bg-brand-cream-deep md:inline-flex",
            )}
            href={bookHref}
          >
            Book now
          </Link>
        </div>
      </div>
      <div className="flex min-h-[3.5rem] items-center bg-[#e8def8] px-3.5 py-2.5 sm:min-h-[3.75rem] sm:px-4">
        <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-brand-indigo sm:text-[14px]">
          {label}
        </p>
      </div>
    </article>
  );
}
