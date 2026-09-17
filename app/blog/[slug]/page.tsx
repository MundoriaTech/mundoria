import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  BrandedCtaBand,
  BrandedPageWash,
  BrandedSection,
} from "@/components/marketing/branded-page-sections";
import { EditorialBody } from "@/components/marketing/editorial-body";
import { MagEngageBand } from "@/components/marketing/mag-engage";
import {
  getBlogPostBySlug,
  listRelatedBlogPosts,
  renderEditorialBlocks,
} from "@/lib/content/editorial";
import { magThemeFor } from "@/lib/content/mag-theme";
import { buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

type PageProps = { params: { slug: string } };

export const revalidate = 60;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);
  if (!post) return {};
  return buildPageMetadata({
    description: post.excerpt ?? post.title,
    path: `/blog/${post.slug}`,
    title: `${post.title} | Mundoria Mag`,
  });
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const post = await getBlogPostBySlug(params.slug);
  if (!post) notFound();

  const related = await listRelatedBlogPosts(post.category, post.slug);
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";
  const blocks = renderEditorialBlocks(post.content);
  const theme = magThemeFor(post.category);

  return (
    <BrandedPageWash>
        {/* Editorial hero: cover first, title below — real-blog rhythm */}
        <section className="relative px-4 pt-10 sm:px-8 sm:pt-12 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <Link
              className="text-sm font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
              href="/blog"
            >
              ← Mundoria Mag
            </Link>

            <div
              className="mt-5 overflow-hidden rounded-[1.75rem] shadow-[0_20px_48px_rgba(49,44,121,0.14)] ring-1 ring-black/5"
              style={
                post.cover_url
                  ? {
                      backgroundImage: `url(${JSON.stringify(post.cover_url)})`,
                      backgroundPosition: "center",
                      backgroundSize: "cover",
                    }
                  : {
                      backgroundImage: `linear-gradient(135deg, ${theme.accent} 0%, #823fb2 55%, #f0a888 100%)`,
                    }
              }
            >
              <div className="aspect-[16/9] w-full sm:aspect-[2/1]" />
            </div>

            <div className="mx-auto mt-8 max-w-3xl">
              <span
                className={cn(
                  "inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                  theme.chip,
                )}
              >
                {post.category}
              </span>
              <h1 className="mt-4 text-[2rem] font-semibold tracking-[-0.045em] text-[#1c133b] sm:text-[2.75rem] sm:leading-[1.1]">
                {post.title}
              </h1>
              {post.excerpt ? (
                <p className="mt-4 text-base leading-7 text-[#5a5470] sm:text-lg sm:leading-8">
                  {post.excerpt}
                </p>
              ) : null}
              <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[#eadfce] pb-6 text-sm text-[#5a5470]">
                <span className="font-semibold text-[#1c133b]">
                  {post.author_name}
                </span>
                <span aria-hidden>·</span>
                <time dateTime={post.published_at ?? post.created_at}>
                  {formatDate(post.published_at ?? post.created_at)}
                </time>
              </div>
            </div>
          </div>
        </section>

        <BrandedSection className="!pt-8">
          <EditorialBody accent={theme.accent} blocks={blocks} />

          <div className="mx-auto mt-14 max-w-3xl">
            <MagEngageBand />
          </div>

          {related.length ? (
            <div className="mx-auto mt-14 max-w-3xl">
              <h2 className="text-xl font-semibold text-[#1c133b]">
                Keep reading
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {related.map((item) => {
                  const relatedTheme = magThemeFor(item.category);
                  return (
                    <Link
                      className={cn(
                        "group overflow-hidden rounded-[1.25rem] border border-[#e4daf5]/80 transition hover:-translate-y-0.5",
                        relatedTheme.soft,
                      )}
                      href={`/blog/${item.slug}`}
                      key={item.id}
                    >
                      <div
                        className="h-24"
                        style={
                          item.cover_url
                            ? {
                                backgroundImage: `url(${JSON.stringify(item.cover_url)})`,
                                backgroundPosition: "center",
                                backgroundSize: "cover",
                              }
                            : {
                                backgroundImage: `linear-gradient(135deg, ${relatedTheme.accent}, #823fb2)`,
                              }
                        }
                      />
                      <div className="p-4">
                        <p
                          className={cn(
                            "text-[11px] font-semibold uppercase tracking-[0.14em]",
                            relatedTheme.label,
                          )}
                        >
                          {item.category}
                        </p>
                        <h3 className="mt-2 text-sm font-semibold text-[#1c133b] transition group-hover:text-[#6a45b8]">
                          {item.title}
                        </h3>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}
        </BrandedSection>

        <BrandedCtaBand
          body="Book online with a clear estimate and live status."
          href={bookingHref}
          label="Book a clean"
          title="Need a cleaner?"
        />
      </BrandedPageWash>
  );
}
