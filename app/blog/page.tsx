import type { Metadata } from "next";
import Link from "next/link";

import {
  BrandedCtaBand,
  BrandedSection,
} from "@/components/marketing/branded-page-sections";
import { MagCategoryIcon } from "@/components/marketing/mag-category-icon";
import { MagEngageBand } from "@/components/marketing/mag-engage";
import { LANDING_NAV_BLOCK } from "@/components/marketing/landing/nav-metrics";
import { PaginationLinks } from "@/components/shared/pagination-controls";
import {
  BLOG_CATEGORIES,
  listPublishedBlogPosts,
  type BlogPost,
} from "@/lib/content/editorial";
import { magThemeFor } from "@/lib/content/mag-theme";
import {
  clampPage,
  PAGE_SIZES,
  parsePage,
  slicePage,
  totalPages,
} from "@/lib/pagination";
import { buildPageMetadata } from "@/lib/seo/site";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Mundoria Mag — cleaning tips, home care, host guides, Birmingham life and cleaner stories.",
  path: "/blog",
  title: "Mundoria Mag | Cleaning & home magazine",
});

export const revalidate = 60;

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function coverStyle(post: BlogPost) {
  if (post.cover_url) {
    return {
      backgroundImage: `url(${JSON.stringify(post.cover_url)})`,
      backgroundPosition: "center",
      backgroundSize: "cover",
    } as const;
  }
  const theme = magThemeFor(post.category);
  return {
    backgroundImage: `linear-gradient(135deg, ${theme.accent} 0%, #823fb2 55%, #f0a888 100%)`,
  } as const;
}

function CategoryChip({
  active,
  href,
  label,
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  const theme = label === "All" ? null : magThemeFor(label);

  if (!theme) {
    return (
      <Link
        aria-current={active ? "page" : undefined}
        className={cn(
          "inline-flex items-center rounded-sm border px-4 py-2 text-xs font-semibold transition",
          active
            ? "border-transparent text-white shadow-[0_6px_16px_rgba(106,69,184,0.35)]"
            : "border-[#d9ccef] bg-white/90 text-[#1c133b] hover:border-[#6a45b8]",
        )}
        href={href}
        style={active ? { backgroundColor: "#6a45b8" } : undefined}
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex items-center rounded-sm border px-4 py-2 text-xs font-semibold transition",
        active
          ? "border-transparent text-white shadow-md"
          : cn(theme.chip, "hover:brightness-95"),
      )}
      href={href}
      style={
        active
          ? {
              backgroundColor: theme.accent,
              boxShadow: `0 6px 16px ${theme.accent}59`,
            }
          : undefined
      }
    >
      {label}
    </Link>
  );
}

function FeaturedCard({
  post,
  large,
}: {
  large?: boolean;
  post: BlogPost;
}) {
  const theme = magThemeFor(post.category);
  return (
    <Link
      className={
        large
          ? "group relative flex min-h-[22rem] flex-col justify-end overflow-hidden rounded-[1.75rem] shadow-[0_18px_40px_rgba(49,44,121,0.14)] sm:min-h-[26rem]"
          : "group relative flex min-h-[18rem] flex-col justify-end overflow-hidden rounded-[1.75rem] shadow-[0_14px_32px_rgba(49,44,121,0.12)]"
      }
      href={`/blog/${post.slug}`}
    >
      <div
        className="absolute inset-0 scale-100 transition duration-500 group-hover:scale-[1.03]"
        style={coverStyle(post)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
      <div className="relative z-10 p-6 sm:p-8">
        <span
          className="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white"
          style={{ backgroundColor: `${theme.accent}cc` }}
        >
          {post.category}
        </span>
        <h2
          className={
            large
              ? "mt-3 max-w-xl text-2xl font-semibold tracking-[-0.04em] text-white sm:text-4xl"
              : "mt-3 text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl"
          }
        >
          {post.title}
        </h2>
        {post.excerpt ? (
          <p className="mt-3 max-w-lg text-sm leading-6 text-white/85 line-clamp-2">
            {post.excerpt}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

function ArticleRow({ post }: { post: BlogPost }) {
  const theme = magThemeFor(post.category);
  return (
    <Link
      className="group grid gap-4 border-b border-black/5 py-6 last:border-b-0 sm:grid-cols-[8.5rem_1fr] sm:gap-6"
      href={`/blog/${post.slug}`}
    >
      <div
        className="h-28 overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5 sm:h-full sm:min-h-[6rem]"
        style={coverStyle(post)}
      />
      <div className="min-w-0">
        <p
          className={cn(
            "text-[11px] font-semibold uppercase tracking-[0.16em]",
            theme.label,
          )}
        >
          {post.category}
        </p>
        <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#1c133b] transition group-hover:text-[#6a45b8]">
          {post.title}
        </h3>
        {post.excerpt ? (
          <p className="mt-2 text-sm leading-6 text-[#5a5470] line-clamp-2">
            {post.excerpt}
          </p>
        ) : null}
        <p className="mt-3 text-xs text-[#5a5470]">
          {post.author_name} · {formatDate(post.published_at ?? post.created_at)}
        </p>
      </div>
    </Link>
  );
}

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams?: { category?: string; page?: string };
}) {
  const configured = hasSupabasePublicConfig();
  const bookingHref = configured ? "/booking/new" : "/setup";
  const posts = await listPublishedBlogPosts();
  const rawCategory = searchParams?.category ?? "All";
  const category =
    rawCategory === "All"
      ? "All"
      : decodeURIComponent(rawCategory.replace(/\+/g, " ")).trim();
  const knownCategory =
    category === "All" ||
    BLOG_CATEGORIES.includes(category as (typeof BLOG_CATEGORIES)[number]);
  const activeCategory = knownCategory ? category : "All";
  const filtered =
    activeCategory === "All"
      ? posts
      : posts.filter((post) => post.category === activeCategory);

  const isAll = activeCategory === "All";
  // On "See all" / category views, list every post — don't hide the first 3
  // inside featured cards and leave a blank list when a section is small.
  const featured = isAll ? filtered.slice(0, 3) : [];
  const listPosts = isAll ? filtered.slice(3) : filtered;
  const magPageSize = PAGE_SIZES.mag;
  const magPages = totalPages(listPosts.length, magPageSize);
  const magPage = clampPage(parsePage(searchParams?.page), magPages);
  const pagedListPosts = isAll
    ? listPosts
    : slicePage(listPosts, magPage, magPageSize);
  const categoriesInFeed = BLOG_CATEGORIES.filter(
    (item) =>
      item !== "All" &&
      posts.some((post) => post.category === item),
  );
  const categoryQuery =
    activeCategory === "All"
      ? {}
      : { category: activeCategory };

  return (
    <>
      <div
        className="relative overflow-hidden bg-[#faf8ff]"
        style={{ marginTop: `calc(-1 * ${LANDING_NAV_BLOCK})` }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[30rem]"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 65% 50% at 10% 0%, rgba(240, 168, 136, 0.28) 0%, transparent 58%), radial-gradient(ellipse 45% 40% at 90% 6%, rgba(232, 90, 151, 0.1) 0%, transparent 52%), linear-gradient(180deg, #fff6f1 0%, #faf8ff 72%)",
          }}
        />
        <div className="relative">
        <section
          className="relative px-4 pb-2 sm:px-8 lg:px-12"
          style={{ paddingTop: `calc(${LANDING_NAV_BLOCK} + 2.75rem)` }}
        >
          <div className="mx-auto max-w-6xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#d4694a]">
              The magazine
            </p>
            <h1 className="mt-4 max-w-3xl text-[3rem] font-black leading-[0.95] tracking-[-0.05em] text-[#1c133b] sm:text-[4.75rem]">
              Mundoria Mag
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#5a5470] sm:text-lg">
              Cleaning & home magazine — practical guides, host tips and
              Birmingham stories for real homes.
            </p>
          </div>
        </section>

        <BrandedSection>
          <div className="flex flex-wrap gap-2">
            {BLOG_CATEGORIES.map((item) => {
              const href =
                item === "All"
                  ? "/blog"
                  : `/blog?category=${encodeURIComponent(item)}`;
              return (
                <CategoryChip
                  active={activeCategory === item}
                  href={href}
                  key={item}
                  label={item}
                />
              );
            })}
          </div>

          {!posts.length ? (
            <p className="mt-10 max-w-xl text-sm leading-7 text-[#5a5470]">
              Stories will appear here once Mag content is published.
            </p>
          ) : !filtered.length ? (
            <p className="mt-10 max-w-xl text-sm leading-7 text-[#5a5470]">
              No stories in this section yet.{" "}
              <Link
                className="font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
                href="/blog"
              >
                Browse all Mag stories
              </Link>
              .
            </p>
          ) : (
            <>
              {featured.length ? (
                <div className="mt-10 grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
                  {featured[0] ? (
                    <FeaturedCard large post={featured[0]} />
                  ) : null}
                  <div className="grid gap-4">
                    {featured.slice(1).map((post) => (
                      <FeaturedCard key={post.id} post={post} />
                    ))}
                  </div>
                </div>
              ) : null}

              {isAll ? (
                <div className="mt-16 sm:mt-20">
                  <MagEngageBand />
                </div>
              ) : null}

              {isAll
                ? categoriesInFeed.map((section) => {
                    const sectionPosts = posts.filter(
                      (post) => post.category === section,
                    );
                    if (!sectionPosts.length) return null;
                    const theme = magThemeFor(section);
                    const panelByCategory: Record<string, string> = {
                      "Cleaning Tips": "bg-[#efe6ff]",
                      "Home Care": "bg-[#f0e4ec]",
                      "Host Tips": "bg-[#e8f7f5]",
                      "Birmingham Life": "bg-[#e8f2ff]",
                      "Cleaner Stories": "bg-[#eeecff]",
                      "Company News": "bg-[#ececef]",
                    };
                    return (
                      <section
                        className={cn(
                          "mt-10 overflow-hidden rounded-[1.75rem] px-5 py-7 sm:px-8 sm:py-9",
                          panelByCategory[section] ?? "bg-[#efe6ff]",
                        )}
                        key={section}
                      >
                        <div className="flex items-start justify-between gap-4 border-b border-[#1c133b]/10 pb-5">
                          <div className="flex items-start gap-4">
                            <MagCategoryIcon category={section} />
                            <div>
                              <p
                                className={cn(
                                  "text-[11px] font-semibold uppercase tracking-[0.18em]",
                                  theme.label,
                                )}
                              >
                                Magazine
                              </p>
                              <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#1c133b] sm:text-3xl">
                                {section}
                              </h2>
                            </div>
                          </div>
                          <Link
                            className={cn(
                              "shrink-0 pt-1 text-sm font-semibold underline-offset-2 hover:underline",
                              theme.label,
                            )}
                            href={`/blog?category=${encodeURIComponent(section)}`}
                          >
                            See all
                          </Link>
                        </div>
                        <div className="mt-2">
                          {sectionPosts.slice(0, 4).map((post) => (
                            <ArticleRow key={post.id} post={post} />
                          ))}
                        </div>
                      </section>
                    );
                  })
                : listPosts.length ? (
                    <section
                      className={cn(
                        "mt-10 overflow-hidden rounded-[1.75rem] px-5 py-7 sm:px-8 sm:py-9",
                        magThemeFor(activeCategory).soft,
                      )}
                    >
                      <div className="flex items-start gap-4 border-b border-[#1c133b]/10 pb-5">
                        <MagCategoryIcon category={activeCategory} />
                        <div>
                          <p
                            className={cn(
                              "text-[11px] font-semibold uppercase tracking-[0.18em]",
                              magThemeFor(activeCategory).label,
                            )}
                          >
                            Magazine
                          </p>
                          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#1c133b] sm:text-3xl">
                            {activeCategory}
                          </h2>
                          <p className="mt-1 text-sm text-[#5a5470]">
                            {listPosts.length} stor
                            {listPosts.length === 1 ? "y" : "ies"}
                            {magPages > 1
                              ? ` · page ${magPage} of ${magPages}`
                              : null}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2">
                        {pagedListPosts.map((post) => (
                          <ArticleRow key={post.id} post={post} />
                        ))}
                      </div>
                      <PaginationLinks
                        className="mt-8 border-t border-[#1c133b]/10 pt-6 [&_p]:text-[#5a5470]"
                        page={magPage}
                        pageSize={magPageSize}
                        pathname="/blog"
                        query={categoryQuery}
                        totalItems={listPosts.length}
                      />
                    </section>
                  ) : null}

              {!isAll ? (
                <div className="mt-16 sm:mt-20">
                  <MagEngageBand />
                </div>
              ) : null}
            </>
          )}
        </BrandedSection>

        <BrandedCtaBand
          body="Clear estimates, vetted cleaners and live status — starting in Birmingham."
          href={bookingHref}
          label="Book a clean"
          title="Ready for a cleaner home?"
        />
        </div>
      </div>
    </>
  );
}
