import type { ReactNode } from "react";

import { MagFooter } from "@/components/marketing/mag-footer";
import {
  MagNavbar,
  type MagNavCategory,
} from "@/components/marketing/mag-navbar";
import { LocationStickyBookBar } from "@/components/marketing/location-sticky-book-bar";
import { SupportMessengerWidget } from "@/components/support/support-messenger";
import {
  BLOG_CATEGORIES,
  listPublishedBlogPosts,
} from "@/lib/content/editorial";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

/** Standalone Mag chrome — landing-style pill nav + Mag footer. */
export async function MagShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";
  const posts = await listPublishedBlogPosts();

  const categories: MagNavCategory[] = BLOG_CATEGORIES.filter(
    (item) => item !== "All",
  ).map((label) => ({
    href: `/blog?category=${encodeURIComponent(label)}`,
    label,
    posts: posts
      .filter((post) => post.category === label)
      .slice(0, 5)
      .map((post) => ({
        href: `/blog/${post.slug}`,
        title: post.title,
      })),
  }));

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col bg-[#faf8ff] text-foreground",
        className,
      )}
    >
      <MagNavbar bookingHref={bookingHref} categories={categories} />
      <main className="flex-1">{children}</main>
      <LocationStickyBookBar
        bookingHref={bookingHref}
        label="Book my cleaning"
        secondary="Free quote — no commitment"
      />
      <MagFooter bookingHref={bookingHref} />
      <SupportMessengerWidget />
    </div>
  );
}
