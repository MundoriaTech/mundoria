import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  BrandedPageWash,
  BrandedSection,
} from "@/components/marketing/branded-page-sections";
import { EditorialBody } from "@/components/marketing/editorial-body";
import { JsonLd } from "@/components/marketing/json-ld";
import { ContactSupportButton } from "@/components/shared/contact-support-button";
import {
  getHelpArticleBySlug,
  listHelpArticlesForCollection,
  renderEditorialBlocks,
} from "@/lib/content/editorial";
import { organizationRef } from "@/lib/seo/structured-data";
import {
  helpThemeFor,
  helpTopicAccent,
  helpTopicPanel,
} from "@/lib/content/help-theme";
import {
  MAX_TITLE_LENGTH,
  absoluteUrl,
  buildPageMetadata,
  fullDescription,
} from "@/lib/seo/site";
import { cn } from "@/lib/utils";

type PageProps = { params: { slug: string } };

export const revalidate = 60;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const article = await getHelpArticleBySlug(params.slug);
  if (!article) return {};
  const helpTitle = `${article.title} | Mundoria Help`;
  return buildPageMetadata({
    description: fullDescription(
      article.summary || article.title,
      `Answers from the Mundoria Help Centre${article.collection ? `, ${article.collection.title}` : ""}.`,
      "Book and manage cleaning in Birmingham with Mundoria.",
    ),
    path: `/help/article/${article.slug}`,
    title: helpTitle.length <= MAX_TITLE_LENGTH ? helpTitle : article.title,
  });
}

export default async function HelpArticlePage({ params }: PageProps) {
  const article = await getHelpArticleBySlug(params.slug);
  if (!article) notFound();
  const blocks = renderEditorialBlocks(article.body);
  const collectionSlug = article.collection?.slug ?? "for-customers";
  const topic = article.topic?.trim() || "";
  const panel = helpTopicPanel(collectionSlug, topic);
  const accent = helpTopicAccent(topic);
  const theme = helpThemeFor(collectionSlug);
  // Every article links to its siblings, so none is only reachable from the sitemap.
  const siblings = article.collection_id
    ? (await listHelpArticlesForCollection(article.collection_id)).filter(
        (item) => item.slug !== article.slug,
      )
    : [];
  const related = [
    ...siblings.filter((item) => topic && item.topic?.trim() === topic),
    ...siblings.filter((item) => !topic || item.topic?.trim() !== topic),
  ].slice(0, 6);
  const articleUrl = absoluteUrl(`/help/article/${article.slug}`);

  return (
    <BrandedPageWash>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", item: absoluteUrl("/help"), name: "Help Centre", position: 1 },
              ...(article.collection
                ? [
                    {
                      "@type": "ListItem",
                      item: absoluteUrl(`/help/${article.collection.slug}`),
                      name: article.collection.title,
                      position: 2,
                    },
                  ]
                : []),
              {
                "@type": "ListItem",
                item: articleUrl,
                name: article.title,
                position: article.collection ? 3 : 2,
              },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "Article",
            author: organizationRef(),
            description: article.summary || article.title,
            headline: article.title,
            inLanguage: "en-GB",
            mainEntityOfPage: articleUrl,
            publisher: organizationRef(),
          },
        ]}
      />
      <section className={cn("relative px-4 pb-8 pt-10 sm:px-8 sm:pt-12 lg:px-12", panel)}>
        <div className="mx-auto max-w-3xl">
          <Link
            className="text-sm font-semibold underline-offset-2 hover:underline"
            href={
              article.collection
                ? `/help/${article.collection.slug}`
                : "/help"
            }
            style={{ color: accent }}
          >
            ← {article.collection?.title ?? "Help Centre"}
          </Link>
          {topic ? (
            <p
              className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: accent }}
            >
              {topic}
            </p>
          ) : (
            <p className={cn("mt-6 text-[11px] font-semibold uppercase tracking-[0.18em]", theme.eyebrow)}>
              Help
            </p>
          )}
          <h1 className="mt-3 text-[2.1rem] font-semibold tracking-[-0.045em] text-[#1c133b] sm:text-4xl">
            {article.title}
          </h1>
          {article.summary ? (
            <p className="mt-4 text-sm leading-7 text-[#5a5470]">
              {article.summary}
            </p>
          ) : null}
        </div>
      </section>

      <BrandedSection className="!pt-8">
        <EditorialBody accent={accent} blocks={blocks} />

        {related.length ? (
          <nav
            aria-label="Related help articles"
            className="mx-auto mt-12 max-w-3xl"
          >
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#1c133b]">
              Related articles
            </h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {related.map((item) => (
                <li key={item.slug}>
                  <Link
                    className="block rounded-xl border border-[#e8e1f3] bg-white px-4 py-3 text-sm font-medium text-[#1c133b] transition hover:border-[#6a45b8]"
                    href={`/help/article/${item.slug}`}
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <div
          className={cn(
            "mx-auto mt-12 max-w-3xl rounded-[1.35rem] px-5 py-6",
            panel,
          )}
        >
          <p className="text-sm font-semibold text-[#1c133b]">
            Didn’t find what you need?
          </p>
          <p className="mt-2 text-sm leading-6 text-[#5a5470]">
            Try the{" "}
            <Link
              className="font-semibold underline-offset-2 hover:underline"
              href="/faq"
              style={{ color: accent }}
            >
              FAQ
            </Link>{" "}
            or reach the Mundoria team in chat, we’ll point you to the right
            place.
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ContactSupportButton
              className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-white transition hover:brightness-95"
              style={{ backgroundColor: accent }}
            />
            <Link
              className="inline-flex h-11 items-center justify-center rounded-full border border-[#d9ccef] bg-white px-5 text-sm font-semibold text-[#1c133b] transition hover:bg-white/80"
              href="/faq"
            >
              Browse FAQ
            </Link>
          </div>
        </div>
      </BrandedSection>
    </BrandedPageWash>
  );
}
