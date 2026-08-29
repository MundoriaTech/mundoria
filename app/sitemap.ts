import type { MetadataRoute } from "next";

import {
  BIRMINGHAM_AREAS,
  LAUNCH_CITY,
  MARKETING_SERVICES,
} from "@/lib/seo/marketing";
import { absoluteUrl } from "@/lib/seo/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes = [
    "",
    "/cleaning",
    "/cleaners/birmingham",
    "/faq",
    "/how-it-works",
    "/pricing",
    "/for-cleaners",
    "/privacy",
    "/terms",
  ].map((path) => ({
    changeFrequency: "weekly" as const,
    lastModified: now,
    priority: path === "" ? 1 : 0.8,
    url: absoluteUrl(path || "/"),
  }));

  const serviceRoutes = MARKETING_SERVICES.map((service) => ({
    changeFrequency: "weekly" as const,
    lastModified: now,
    priority: 0.7,
    url: absoluteUrl(`/cleaning/${service.slug}`),
  }));

  const areaRoutes = BIRMINGHAM_AREAS.map((area) => ({
    changeFrequency: "weekly" as const,
    lastModified: now,
    priority: 0.7,
    url: absoluteUrl(`/cleaners/${LAUNCH_CITY.slug}/${area.slug}`),
  }));

  return [...staticRoutes, ...serviceRoutes, ...areaRoutes];
}
