import type { Metadata } from "next";

export const SITE_NAME = "Mundoria";
export const SITE_TAGLINE =
  "Book trusted UK cleaning professionals for homes, workplaces and short-term rentals.";
export const SUPPORT_EMAIL = "support@mundoriauk.com";
/** Prefer a wide landscape asset for social shares when available. */
export const DEFAULT_OG_IMAGE =
  "/images/marketing/landing/category-residential.png";

/** Canonical public host — apex redirects to www in production. */
const CANONICAL_SITE_URL = "https://www.mundoria.com";

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) {
    // Keep sitemap/canonicals on www even if env is set to the apex domain.
    if (
      configured === "https://mundoria.com" ||
      configured === "http://mundoria.com"
    ) {
      return CANONICAL_SITE_URL;
    }
    return configured;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return CANONICAL_SITE_URL;
}

export function absoluteUrl(path = "/") {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** One brand mention — avoids `Title | Mundoria | Mundoria` from the root template. */
export function brandedTitle(title: string) {
  const trimmed = title.trim();
  if (/\bMundoria\b/i.test(trimmed)) return trimmed;
  return `${trimmed} | ${SITE_NAME}`;
}

export function buildPageMetadata({
  title,
  description,
  path = "/",
  noIndex = false,
  image = DEFAULT_OG_IMAGE,
}: {
  description: string;
  image?: string;
  noIndex?: boolean;
  path?: string;
  title: string;
}): Metadata {
  const url = absoluteUrl(path);
  const ogImage = absoluteUrl(image);
  const resolvedTitle = brandedTitle(title);

  return {
    alternates: { canonical: url },
    description,
    openGraph: {
      description,
      images: [{ alt: resolvedTitle, url: ogImage }],
      locale: "en_GB",
      siteName: SITE_NAME,
      title: resolvedTitle,
      type: "website",
      url,
    },
    robots: noIndex
      ? { follow: false, index: false }
      : { follow: true, index: true },
    title: { absolute: resolvedTitle },
    twitter: {
      card: "summary_large_image",
      description,
      images: [ogImage],
      title: resolvedTitle,
    },
  };
}

/** Metadata for signed-in / transactional surfaces that must not be indexed. */
export function buildPrivateMetadata(title: string): Metadata {
  return {
    robots: { follow: false, index: false },
    title,
  };
}
