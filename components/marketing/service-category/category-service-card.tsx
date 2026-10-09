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
  href,
  image,
  label,
  objectPosition = "object-center",
  sizes,
}: {
  bookingHref: string;
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
      className="group flex w-[min(78vw,17.5rem)] shrink-0 snap-start flex-col overflow-hidden rounded-[1.35rem] bg-white shadow-[0_12px_32px_rgba(28,19,59,0.12)] transition duration-300 [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:shadow-[0_16px_36px_rgba(28,19,59,0.16)] sm:w-[19rem] lg:w-auto"
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
          aria-label={`Show Read more and Book now for ${label}`}
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
            "absolute inset-0 z-[2] flex items-center justify-center gap-2 bg-[#1c133b]/55 px-3 transition duration-300",
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
              "border border-white text-white hover:bg-white hover:text-[#1c133b]",
            )}
            href={href}
          >
            Read more
          </Link>
          <Link
            aria-label={`Book ${label}`}
            className={cn(
              overlayLinkClass,
              "bg-white text-[#1c133b] hover:bg-[#f3efe6]",
            )}
            href={bookHref}
          >
            Book now
          </Link>
        </div>
      </div>
      <div className="flex min-h-[2.75rem] items-center bg-[#e8def8] px-4 py-2.5">
        <p className="text-[14px] font-semibold leading-snug text-[#312c79]">
          {label}
        </p>
      </div>
    </article>
  );
}
