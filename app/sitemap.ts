import type { MetadataRoute } from "next";

import {
  listPublishedBlogPosts,
  listHelpCollections,
  listPublishedHelpArticles,
} from "@/lib/content/editorial";
import {
  birminghamTownZones,
  birminghamCoveragePlaces,
  coveragePlaceHref,
  coverageZoneHref,
} from "@/lib/seo/birmingham-coverage";
import {
  BIRMINGHAM_AREAS,
  BIRMINGHAM_POSTCODES,
  LAUNCH_CITY,
  MARKETING_CATEGORY_PATHS,
  MARKETING_SERVICES,
  postcodePath,
  servicePlacePath,
  servicePlaceZonePath,
} from "@/lib/seo/marketing";
import { SERVICE_GUIDE_TOPICS, serviceGuidePath } from "@/lib/seo/service-guides";
import { absoluteUrl } from "@/lib/seo/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

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

  const serviceRoutes = MARKETING_SERVICES.map((service) => ({
    changeFrequency: "weekly" as const,
    lastModified: now,
    priority: 0.7,
    url: absoluteUrl(`/cleaning/${service.slug}`),
  }));

  const serviceAreaSlugs = Array.from(
    new Set([
      ...BIRMINGHAM_AREAS.map((area) => area.slug),
      ...birminghamCoveragePlaces().map((place) => place.slug),
    ]),
  );
  const servicePlaceRoutes = MARKETING_SERVICES.flatMap((service) => [
    {
      changeFrequency: "weekly" as const,
      lastModified: now,
      priority: 0.65,
      url: absoluteUrl(servicePlacePath(service.slug)),
    },
    ...birminghamTownZones().map((zone) => ({
      changeFrequency: "weekly" as const,
      lastModified: now,
      priority: 0.6,
      url: absoluteUrl(servicePlaceZonePath(service.slug, zone.id)),
    })),
    ...serviceAreaSlugs.map((area) => ({
      changeFrequency: "weekly" as const,
      lastModified: now,
      priority: 0.55,
      url: absoluteUrl(servicePlacePath(service.slug, area)),
    })),
  ]);

  const guideRoutes = MARKETING_SERVICES.flatMap((service) =>
    SERVICE_GUIDE_TOPICS.map((topic) => ({
      changeFrequency: "monthly" as const,
      lastModified: now,
      priority: 0.55,
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
        priority: 0.55,
        url: absoluteUrl(coveragePlaceHref(place)),
      })),
    ...birminghamTownZones().map((zone) => ({
      changeFrequency: "weekly" as const,
      lastModified: now,
      priority: 0.6,
      url: absoluteUrl(coverageZoneHref(zone.id)),
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
    ...servicePlaceRoutes,
    ...guideRoutes,
    ...postcodeRoutes,
    ...areaRoutes,
    ...blogRoutes,
    ...helpCollectionRoutes,
    ...helpArticleRoutes,
  ];
}
