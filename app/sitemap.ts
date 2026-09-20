import type { MetadataRoute } from "next";

import {
  listPublishedBlogPosts,
  listHelpCollections,
  listPublishedHelpArticles,
} from "@/lib/content/editorial";
import {
  BIRMINGHAM_AREAS,
  LAUNCH_CITY,
  MARKETING_CATEGORY_PATHS,
  MARKETING_SERVICES,
} from "@/lib/seo/marketing";
import { absoluteUrl } from "@/lib/seo/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes = [
    "",
    "/cleaning",
    "/cleaners/birmingham",
    "/faq",
    "/help",
    "/blog",
    "/contact",
    "/how-it-works",
    "/pricing",
    "/for-cleaners",
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

  const areaRoutes = BIRMINGHAM_AREAS.map((area) => ({
    changeFrequency: "weekly" as const,
    lastModified: now,
    priority: 0.7,
    url: absoluteUrl(`/cleaners/${LAUNCH_CITY.slug}/${area.slug}`),
  }));

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
    ...areaRoutes,
    ...blogRoutes,
    ...helpCollectionRoutes,
    ...helpArticleRoutes,
  ];
}
