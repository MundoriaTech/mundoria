import type { MetadataRoute } from "next";

import {
  listPublishedBlogPosts,
  listHelpCollections,
  listPublishedHelpArticles,
} from "@/lib/content/editorial";
import {
  birminghamCoveragePlaces,
  coveragePlaceHref,
} from "@/lib/seo/birmingham-coverage";
import { isStandaloneTownSlug } from "@/lib/seo/canonical";
import {
  BIRMINGHAM_AREAS,
  BIRMINGHAM_POSTCODES,
  LAUNCH_CITY,
  MARKETING_CATEGORY_PATHS,
  indexableMarketingServices,
  postcodePath,
} from "@/lib/seo/marketing";
import { SERVICE_GUIDE_TOPICS, serviceGuidePath } from "@/lib/seo/service-guides";
import { absoluteUrl } from "@/lib/seo/site";

/**
 * Lean sitemap: one page per service intent + one page per area.
 * No service×area matrix, no wider-zone duplicates.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const indexableServices = indexableMarketingServices();

  const staticRoutes = [
    "",
    "/cleaning",
    "/cleaners/birmingham",
    "/help",
    "/faq",
    "/blog",
    "/how-it-works",
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

  const postcodeRoutes = BIRMINGHAM_POSTCODES.map((item) => ({
    changeFrequency: "weekly" as const,
    lastModified: now,
    priority: 0.55,
    url: absoluteUrl(postcodePath(item.prefix)),
  }));

  const knownAreaSlugs = new Set(BIRMINGHAM_AREAS.map((area) => area.slug));
  const areaRoutes = [
    ...BIRMINGHAM_AREAS.map((area) => ({
      changeFrequency: "weekly" as const,
      lastModified: now,
      priority: 0.7,
      url: absoluteUrl(`/cleaners/${LAUNCH_CITY.slug}/${area.slug}`),
    })),
    ...birminghamCoveragePlaces()
      .filter((place) => !knownAreaSlugs.has(place.slug))
      .map((place) => ({
        changeFrequency: "weekly" as const,
        lastModified: now,
        priority: isStandaloneTownSlug(place.slug) ? 0.65 : 0.55,
        url: absoluteUrl(coveragePlaceHref(place)),
      })),
  ];

  const [posts, collections, articles] = await Promise.all([
    listPublishedBlogPosts(),
    listHelpCollections(),
    listPublishedHelpArticles(),
  ]);

  const blogRoutes = posts.map((post) => ({
    changeFrequency: "monthly" as const,
    lastModified: post.published_at
      ? new Date(post.published_at)
      : new Date(post.created_at),
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
    lastModified: now,
    priority: 0.5,
    url: absoluteUrl(`/help/article/${article.slug}`),
  }));

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...serviceRoutes,
    ...guideRoutes,
    ...postcodeRoutes,
    ...areaRoutes,
    ...blogRoutes,
    ...helpCollectionRoutes,
    ...helpArticleRoutes,
  ];
}
