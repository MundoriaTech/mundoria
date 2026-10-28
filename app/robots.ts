import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo/site";

const PRIVATE_PREFIXES = [
  "/admin",
  "/admin/",
  "/api/",
  "/dashboard",
  "/dashboard/",
  "/bookings",
  "/bookings/",
  "/booking/",
  "/messages",
  "/messages/",
  "/payments",
  "/payments/",
  "/profile",
  "/addresses",
  // Trailing slash only: bare "/cleaner" also matches public "/cleaners/…" pages.
  "/cleaner/",
  "/setup",
  "/complete-profile",
  "/update-password",
  "/forgot-password",
  "/review",
  "/review/",
  "/admin-invite",
  "/login",
  "/login/",
  "/signup",
  "/signup/",
] as const;

const PUBLIC_MARKETING_ALLOW = [
  "/",
  "/cleaning",
  "/cleaning/",
  "/cleaners/",
  "/help",
  "/help/",
  "/faq",
  "/faq/",
  "/blog",
  "/blog/",
  "/how-it-works",
  "/for-cleaners",
  "/privacy",
  "/cookies",
  "/terms",
  "/llms.txt",
] as const;

const SEARCH_CRAWLERS = ["Googlebot", "Bingbot"] as const;

const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "anthropic-ai",
  "PerplexityBot",
  "Google-Extended",
] as const;

function marketingCrawlerRules(userAgents: readonly string[]) {
  return userAgents.map((userAgent) => ({
    allow: [...PUBLIC_MARKETING_ALLOW],
    disallow: [...PRIVATE_PREFIXES],
    userAgent,
  }));
}

export default function robots(): MetadataRoute.Robots {
  return {
    host: absoluteUrl("/"),
    rules: [
      {
        allow: "/",
        disallow: [...PRIVATE_PREFIXES],
        userAgent: "*",
      },
      ...marketingCrawlerRules(SEARCH_CRAWLERS),
      ...marketingCrawlerRules(AI_CRAWLERS),
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
