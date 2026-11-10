import type { MetadataRoute } from "next";

import {
  listPublishedBlogPosts,
  listHelpCollections,
  listPublishedHelpArticles,
} from "@/lib/content/editorial";
import {
  birminghamCompoundZoneIds,
  birminghamCoveragePlaces,
  coveragePlaceHref,
  coverageZonePath,
} from "@/lib/seo/birmingham-coverage";
import { isStandaloneTownSlug, isIndexableAreaSlug } from "@/lib/seo/canonical";
import {
  BIRMINGHAM_AREAS,
  LAUNCH_CITY,
  MARKETING_CATEGORY_PATHS,
  indexableMarketingServices,
} from "@/lib/seo/marketing";
import { SERVICE_GUIDE_TOPICS, serviceGuidePath } from "@/lib/seo/service-guides";
import { MARKETING_CONTENT_UPDATED_AT, absoluteUrl } from "@/lib/seo/site";

/**
 * Lean sitemap: one page per service intent + one page per area.
 * Compound zone hubs (readable slugs) are included; service×area matrix is not.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Real dates only: marketing templates change on deploys that touch them,
  // editorial rows carry their own updated_at. "Now" on every request told
  // Google every URL changed every day, which makes lastmod meaningless.
  const now = new Date(MARKETING_CONTENT_UPDATED_AT);
  const indexableServices = indexableMarketingServices();

  const staticRoutes = [
    "",
    "/cleaning",
    "/cleaners/birmingham",
    "/help",
    "/faq",
    "/blog",
    "/how-it-works",
    "/about",
    "/for-cleaners",
    "/contact",
    "/privacy",
    "/cookies",
    "/terms",
  ].map((path) => ({
    changeFrequency: "weekly" as const,
    lastModified: now,
    priority: path === "" ? 1 : 0.8,
    url: absoluteUrl(path || "/"),
  }));

  const categoryRoutes = MARKETING_CATEGORY_PATHS.map((path) => ({
    changeFrequency: "weekly" as const,
    lastModified: now,
    priority: 0.85,
    url: absoluteUrl(path),
  }));

  const serviceRoutes = indexableServices.map((service) => ({
    changeFrequency: "weekly" as const,
    lastModified: now,
    priority: 0.75,
    url: absoluteUrl(`/cleaning/${service.slug}`),
  }));

  const guideRoutes = indexableServices.flatMap((service) =>
    SERVICE_GUIDE_TOPICS.map((topic) => ({
      changeFrequency: "monthly" as const,
      lastModified: now,
      priority: 0.5,
      url: absoluteUrl(serviceGuidePath(service.slug, topic)),
    })),
  );

  const knownAreaSlugs = new Set(BIRMINGHAM_AREAS.map((area) => area.slug));
  const areaRoutes = [
    ...BIRMINGHAM_AREAS.filter((area) => isIndexableAreaSlug(area.slug)).map(
      (area) => ({
        changeFrequency: "weekly" as const,
        lastModified: now,
        priority: 0.7,
        url: absoluteUrl(`/cleaners/${LAUNCH_CITY.slug}/${area.slug}`),
      }),
    ),
    ...birminghamCoveragePlaces()
      .filter(
        (place) =>
          !knownAreaSlugs.has(place.slug) && isIndexableAreaSlug(place.slug),
      )
      .map((place) => ({
        changeFrequency: "weekly" as const,
        lastModified: now,
        priority: isStandaloneTownSlug(place.slug) ? 0.65 : 0.55,
        url: absoluteUrl(coveragePlaceHref(place)),
      })),
    ...birminghamCompoundZoneIds().map((zoneId) => ({
      changeFrequency: "weekly" as const,
      lastModified: now,
      priority: 0.6,
      url: absoluteUrl(coverageZonePath(zoneId)),
    })),
  ];

  const [posts, collections, articles] = await Promise.all([
    listPublishedBlogPosts(),
    listHelpCollections(),
    listPublishedHelpArticles(),
  ]);

  const blogRoutes = posts.map((post) => ({
    changeFrequency: "monthly" as const,
    lastModified: new Date(
      post.updated_at ?? post.published_at ?? post.created_at,
    ),
    priority: 0.6,
    url: absoluteUrl(`/blog/${post.slug}`),
  }));

  const helpCollectionRoutes = collections.map((collection) => ({
    changeFrequency: "monthly" as const,
    lastModified: now,
    priority: 0.55,
    url: absoluteUrl(`/help/${collection.slug}`),
  }));

  const helpArticleRoutes = articles.map((article) => ({
    changeFrequency: "monthly" as const,
    lastModified: article.updated_at ? new Date(article.updated_at) : now,
    priority: 0.5,
    url: absoluteUrl(`/help/article/${article.slug}`),
  }));

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...serviceRoutes,
    ...guideRoutes,
    ...areaRoutes,
    ...blogRoutes,
    ...helpCollectionRoutes,
    ...helpArticleRoutes,
  ];
}
