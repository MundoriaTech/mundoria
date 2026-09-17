import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  BrandedPageWash,
  BrandedSection,
} from "@/components/marketing/branded-page-sections";
import {
  HelpArticleChevron,
  HelpTopicIcon,
} from "@/components/marketing/help-collection-icon";
import { ContactSupportButton } from "@/components/shared/contact-support-button";
import { PaginationLinks } from "@/components/shared/pagination-controls";
import {
  getHelpCollectionBySlug,
  listHelpArticlesForCollection,
  type HelpArticle,
} from "@/lib/content/editorial";
import { helpThemeFor, helpTopicPanel } from "@/lib/content/help-theme";
import {
  clampPage,
  PAGE_SIZES,
  parsePage,
  slicePage,
  totalPages,
} from "@/lib/pagination";
import { buildPageMetadata } from "@/lib/seo/site";
import { cn } from "@/lib/utils";

type PageProps = {
  params: { collection: string };
  searchParams?: { page?: string };
};

export const revalidate = 60;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const collection = await getHelpCollectionBySlug(params.collection);
  if (!collection) return {};
  return buildPageMetadata({
    description: collection.description,
    path: `/help/${collection.slug}`,
    title: `${collection.title} | Mundoria Help`,
  });
}

function groupByTopic(articles: HelpArticle[]) {
  const groups: { topic: string; articles: HelpArticle[] }[] = [];
  const indexByTopic = new Map<string, number>();

  for (const article of articles) {
    const topic = article.topic?.trim() || "Guides";
    const existing = indexByTopic.get(topic);
    if (existing === undefined) {
      indexByTopic.set(topic, groups.length);
      groups.push({ topic, articles: [article] });
    } else {
      groups[existing].articles.push(article);
    }
  }

  return groups;
}

function topicAnchor(topic: string) {
  return topic
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default async function HelpCollectionPage({
  params,
  searchParams,
}: PageProps) {
  const collection = await getHelpCollectionBySlug(params.collection);
  if (!collection) notFound();
  const articles = await listHelpArticlesForCollection(collection.id);
  const helpPageSize = PAGE_SIZES.help;
  const helpPages = totalPages(articles.length, helpPageSize);
  const helpPage = clampPage(parsePage(searchParams?.page), helpPages);
  const paginate = articles.length > helpPageSize;
  const pageArticles = paginate
    ? slicePage(articles, helpPage, helpPageSize)
    : articles;
  const groups = groupByTopic(pageArticles);
  const allGroups = groupByTopic(articles);
  const theme = helpThemeFor(collection.slug);
  const audienceLabel =
    collection.audience === "cleaners"
      ? "For cleaners"
      : collection.audience === "both"
        ? "Everyone"
        : "For customers";

  return (
    <BrandedPageWash>
        <section
          className={cn(
            "relative px-4 pb-10 pt-10 sm:px-8 sm:pt-12 lg:px-12",
            theme.hero,
          )}
        >
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90",
              theme.soft,
            )}
          />
          <div className="relative mx-auto max-w-4xl">
            <Link
              className="text-sm font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
              href="/help"
            >
              ← Help Centre
            </Link>

            <div className="mt-8">
              <p
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-[0.22em]",
                  theme.eyebrow,
                )}
              >
                {audienceLabel}
              </p>
              <h1 className="mt-3 max-w-xl text-[2.35rem] font-black leading-[0.95] tracking-[-0.05em] text-[#1c133b] sm:text-[3.25rem]">
                {collection.title}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-[#5a5470]">
                {collection.description}
              </p>
              <p className="mt-4 text-sm text-[#5a5470]">
                {articles.length} article{articles.length === 1 ? "" : "s"}
                {allGroups.length > 1
                  ? ` · ${allGroups.length} topics`
                  : null}
                {paginate ? ` · page ${helpPage} of ${helpPages}` : null}
              </p>
            </div>

            {!paginate && allGroups.length > 1 ? (
              <nav
                aria-label="Topics"
                className="mt-7 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#1c133b]/10 pt-5"
              >
                {allGroups.map((group) => (
                  <a
                    className="text-sm font-semibold underline-offset-4 transition hover:underline"
                    href={`#${topicAnchor(group.topic)}`}
                    key={group.topic}
                    style={{ color: theme.accent }}
                  >
                    {group.topic}
                  </a>
                ))}
              </nav>
            ) : null}
          </div>
        </section>

        <BrandedSection>
          <div className="mx-auto max-w-4xl space-y-8">
            {groups.map((group) => (
              <section
                className={cn(
                  "overflow-hidden rounded-[1.75rem] px-5 py-6 sm:px-7 sm:py-8",
                  helpTopicPanel(collection.slug, group.topic),
                )}
                id={topicAnchor(group.topic)}
                key={group.topic}
              >
                <div className="flex items-start gap-4 border-b border-[#1c133b]/10 pb-5">
                  <HelpTopicIcon topic={group.topic} />
                  <div className="min-w-0">
                    <h2 className="text-xl font-black tracking-[-0.03em] text-[#1c133b] sm:text-2xl">
                      {group.topic}
                    </h2>
                    <p className="mt-1 text-sm text-[#5a5470]">
                      {paginate
                        ? `${group.articles.length} on this page`
                        : `${group.articles.length} guide${
                            group.articles.length === 1 ? "" : "s"
                          } in this topic`}
                    </p>
                  </div>
                </div>

                <div className="mt-2 divide-y divide-[#1c133b]/8">
                  {group.articles.map((article) => (
                    <Link
                      className="group flex items-start justify-between gap-4 py-4 transition first:pt-4 last:pb-0"
                      href={`/help/article/${article.slug}`}
                      key={article.id}
                    >
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-[#1c133b] transition group-hover:text-[#6a45b8]">
                          {article.title}
                        </h3>
                        {article.summary ? (
                          <p className="mt-1 text-sm leading-6 text-[#5a5470]">
                            {article.summary}
                          </p>
                        ) : null}
                      </div>
                      <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 ring-1 ring-[#1c133b]/8 transition group-hover:bg-white group-hover:shadow-sm">
                        <HelpArticleChevron />
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}

            <PaginationLinks
              className="[&_p]:text-[#5a5470]"
              page={helpPage}
              pageSize={helpPageSize}
              pathname={`/help/${collection.slug}`}
              totalItems={articles.length}
            />
          </div>

          <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-[1.75rem] bg-[#1c133b] px-6 py-8 sm:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f0a888]">
              Still stuck?
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl">
              Can’t find what you need?
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/75">
              Chat with the Mundoria team. For an active booking, use in-app
              messaging so we can see the full context.
            </p>
            <ContactSupportButton className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#ff5274] px-5 text-sm font-semibold text-white transition hover:bg-[#ff3d63]" />
          </div>
        </BrandedSection>
      </BrandedPageWash>
  );
}
