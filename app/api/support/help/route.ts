import { NextResponse } from "next/server";

import {
  getHelpArticleBySlug,
  getHelpCollectionBySlug,
  listHelpArticlesForCollection,
  listHelpCollections,
  renderEditorialBlocks,
} from "@/lib/content/editorial";

export const dynamic = "force-dynamic";

const COLLECTION_EMOJI: Record<string, string> = {
  "for-customers": "📁",
  "become-a-cleaner": "🚀",
  "cleaner-guide": "📖",
};

/** Help catalogue + in-widget article/collection payloads for the messenger. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const articleSlug = (searchParams.get("article") ?? "").trim();
  const collectionSlug = (searchParams.get("collection") ?? "").trim();

  if (articleSlug) {
    const article = await getHelpArticleBySlug(articleSlug);
    if (!article) {
      return NextResponse.json({ error: "Article not found." }, { status: 404 });
    }
    return NextResponse.json({
      article: {
        blocks: renderEditorialBlocks(article.body),
        collectionSlug: article.collection?.slug ?? null,
        collectionTitle: article.collection?.title ?? null,
        slug: article.slug,
        summary: article.summary,
        title: article.title,
        topic: article.topic,
      },
    });
  }

  if (collectionSlug) {
    const collection = await getHelpCollectionBySlug(collectionSlug);
    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found." },
        { status: 404 },
      );
    }
    const items = await listHelpArticlesForCollection(collection.id);
    return NextResponse.json({
      collection: {
        articleCount: items.length,
        description: collection.description,
        emoji: COLLECTION_EMOJI[collection.slug] ?? "📄",
        slug: collection.slug,
        title: collection.title,
      },
      articles: items.map((article) => ({
        collectionSlug: collection.slug,
        collectionTitle: collection.title,
        slug: article.slug,
        summary: article.summary,
        title: article.title,
        topic: article.topic,
      })),
    });
  }

  const collections = await listHelpCollections();
  const withArticles = await Promise.all(
    collections.map(async (collection) => {
      const items = await listHelpArticlesForCollection(collection.id);
      return {
        collection,
        items,
      };
    }),
  );

  const articles = withArticles.flatMap(({ collection, items }) =>
    items.map((article) => ({
      collectionSlug: collection.slug,
      collectionTitle: collection.title,
      slug: article.slug,
      summary: article.summary,
      title: article.title,
      topic: article.topic,
    })),
  );

  const filtered = q
    ? articles.filter(
        (article) =>
          article.title.toLowerCase().includes(q) ||
          article.summary.toLowerCase().includes(q) ||
          article.topic.toLowerCase().includes(q),
      )
    : articles;

  return NextResponse.json({
    articles: filtered.slice(0, q ? 24 : 12),
    collections: withArticles.map(({ collection, items }) => ({
      articleCount: items.length,
      description: collection.description,
      emoji: COLLECTION_EMOJI[collection.slug] ?? "📄",
      slug: collection.slug,
      title: collection.title,
    })),
  });
}
