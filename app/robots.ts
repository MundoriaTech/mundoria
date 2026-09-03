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
  "/cleaner",
  "/cleaner/",
  "/setup",
  "/complete-profile",
  "/update-password",
  "/forgot-password",
  "/admin-invite",
] as const;

const PUBLIC_MARKETING_ALLOW = [
  "/",
  "/cleaning",
  "/cleaning/",
  "/cleaners/",
  "/faq",
  "/how-it-works",
  "/pricing",
  "/for-cleaners",
  "/privacy",
  "/terms",
  "/llms.txt",
] as const;

const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "anthropic-ai",
  "PerplexityBot",
  "Google-Extended",
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    host: absoluteUrl("/"),
    rules: [
      {
        allow: "/",
        disallow: [...PRIVATE_PREFIXES],
        userAgent: "*",
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        allow: [...PUBLIC_MARKETING_ALLOW],
        disallow: [...PRIVATE_PREFIXES],
        userAgent,
      })),
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
