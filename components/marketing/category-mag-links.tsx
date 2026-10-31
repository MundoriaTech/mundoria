import Link from "next/link";

import {
  listPublishedBlogPosts,
  type BlogPost,
} from "@/lib/content/editorial";
import type { ServiceCategory } from "@/types/customer";

type MagCategory =
  | "commercial"
  | "moving_home"
  | "recovery"
  | "residential"
  | "short_term_rental";

const MAG_HEADING = "From the Mundoria Mag";

/** Mag sections that belong with each service family, in preference order. */
const MAG_SECTIONS: Record<MagCategory, string[]> = {
  commercial: ["Cleaning Tips", "Company News", "Cleaner Stories"],
  moving_home: ["Home Care", "Cleaning Tips", "Local Life"],
  recovery: ["Home Care", "Cleaning Tips", "Cleaner Stories"],
  residential: ["Home Care", "Cleaning Tips", "Local Life"],
  short_term_rental: ["Cleaning Tips", "Home Care", "Local Life"],
};

const LEAD_COUNT = 5;
const INDEX_COUNT = 10;

export function magCategoryFor(
  category: ServiceCategory | null | undefined,
): MagCategory | null {
  if (
    category === "commercial" ||
    category === "moving_home" ||
    category === "recovery" ||
    category === "residential" ||
    category === "short_term_rental"
  ) {
    return category;
  }
  return null;
}

function publishedTime(post: BlogPost) {
  return new Date(post.published_at ?? post.created_at).getTime();
}

/** Rank Mag posts: exact service match → Mag section fit → recency. */
export function rankMagPostsForPage(
  posts: BlogPost[],
  options: {
    category: MagCategory;
    serviceSlug?: string | null;
  },
) {
  const preferred = MAG_SECTIONS[options.category];
  const serviceSlug = options.serviceSlug?.trim() || null;

  return [...posts]
    .map((post, index) => {
      const services = post.related_services ?? [];
      const serviceHit = serviceSlug ? services.includes(serviceSlug) : false;
      const sectionIndex = preferred.indexOf(post.category);
      const sectionHit = sectionIndex >= 0;
      return {
        post,
        score:
          (serviceHit ? 1_000_000 : 0) +
          (sectionHit ? 10_000 - sectionIndex * 100 : 0) +
          publishedTime(post) / 1_000_000 +
          (posts.length - index) * 0.0001,
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.post)
    .slice(0, LEAD_COUNT + INDEX_COUNT);
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB");
}

/** A compact reading list for service category and subcategory pages. */
export async function CategoryMagLinks({
  category,
  serviceSlug,
}: {
  category: MagCategory;
  /** When set, posts tagged with this marketing service slug rank first. */
  serviceSlug?: string | null;
}) {
  const posts = rankMagPostsForPage(await listPublishedBlogPosts(), {
    category,
    serviceSlug,
  });
  if (posts.length === 0) return null;

  const lead = posts.slice(0, LEAD_COUNT);
  const index = posts.slice(LEAD_COUNT);
  const matchedCount = serviceSlug
    ? posts.filter((post) => post.related_services?.includes(serviceSlug)).length
    : 0;

  return (
    <section className="px-4 py-14 sm:px-8 sm:py-16 lg:px-12" id="mundoria-mag">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-16">
        <div>
          <div className="flex items-end justify-between gap-4">
            <h2 className="max-w-[16rem] text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-2xl lg:text-[1.75rem]">
              {MAG_HEADING}
            </h2>
          </div>
          {serviceSlug && matchedCount > 0 ? (
            <p className="mt-3 max-w-sm text-sm leading-6 text-[#5a5470]">
              Guides matched to this service, then more from the Mag.
            </p>
          ) : null}
          <ul className="mt-6 border-t border-[#e7e1f0]">
            {lead.map((post) => (
              <li className="border-b border-[#e7e1f0]" key={post.id}>
                <Link
                  className="group block py-4"
                  href={`/blog/${post.slug}`}
                >
                  <p className="text-[15px] font-semibold leading-snug text-[#1c133b] transition group-hover:text-[#6a45b8]">
                    {post.title}
                  </p>
                  <p className="mt-1.5 text-xs text-[#8b849c]">
                    {formatDate(post.published_at ?? post.created_at)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            className="mt-5 inline-flex text-sm font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
            href="/blog"
          >
            Browse the Mag
          </Link>
        </div>

        {index.length ? (
          <div>
            <h3 className="text-[1.35rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c133b] sm:text-2xl lg:text-[1.75rem]">
              More to read
            </h3>
            <ol className="mt-6 grid gap-x-10 sm:grid-cols-2">
              {index.map((post, position) => (
                <li className="border-b border-[#eee8f4]" key={post.id}>
                  <Link
                    className="group grid grid-cols-[1.75rem_minmax(0,1fr)] items-baseline gap-1 py-3.5"
                    href={`/blog/${post.slug}`}
                  >
                    <span className="text-base font-semibold text-[#c79c66]">
                      {position + 1}
                    </span>
                    <span className="text-[15px] font-medium leading-snug text-[#1c133b] transition group-hover:text-[#6a45b8]">
                      {post.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </section>
  );
}
