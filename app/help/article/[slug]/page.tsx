import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  BrandedPageWash,
  BrandedSection,
} from "@/components/marketing/branded-page-sections";
import { EditorialBody } from "@/components/marketing/editorial-body";
import { ContactSupportButton } from "@/components/shared/contact-support-button";
import {
  getHelpArticleBySlug,
  renderEditorialBlocks,
} from "@/lib/content/editorial";
import {
  helpThemeFor,
  helpTopicAccent,
  helpTopicPanel,
} from "@/lib/content/help-theme";
import { buildPageMetadata } from "@/lib/seo/site";
import { cn } from "@/lib/utils";

type PageProps = { params: { slug: string } };

export const revalidate = 60;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const article = await getHelpArticleBySlug(params.slug);
  if (!article) return {};
  return buildPageMetadata({
    description: article.summary || article.title,
    path: `/help/article/${article.slug}`,
    title: `${article.title} | Mundoria Help`,
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

  return (
    <BrandedPageWash>
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
            Reach the Mundoria team in chat — we’ll point you to the right
            place.
          </p>
          <ContactSupportButton
            className="mt-3 inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-white transition hover:brightness-95"
            style={{ backgroundColor: accent }}
          />
        </div>
      </BrandedSection>
    </BrandedPageWash>
  );
}
