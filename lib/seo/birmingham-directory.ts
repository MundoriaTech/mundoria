import { createClient } from "@supabase/supabase-js";
import { formatDistanceToNow } from "date-fns";

import { SERVICES } from "@/lib/customer/services";
import {
  BIRMINGHAM_AREAS,
  BIRMINGHAM_POSTCODES,
  LAUNCH_CITY,
  prefixesForArea,
} from "@/lib/seo/marketing";
import { bioWithCoverage, milesFromRadiusKm } from "@/lib/seo/cleaner-coverage";

export type DirectoryCleaner = {
  areas: string;
  avatarUrl: string | null;
  bio: string;
  href: string;
  id: string;
  jobs: number;
  name: string;
  prefixes: string[];
  radiusMiles: number | null;
  rating: number;
  reviewCount: number;
  services: string[];
  years: number | null;
};

export type DirectoryReview = {
  author: string;
  body: string;
  score: number | null;
  service: string;
  when: string | null;
};

type CleanerRow = {
  avatar_url: string | null;
  bio: string | null;
  full_name: string;
  id: string;
  postcode_prefixes: string[] | null;
  rating: number | null;
  service_types: string[] | null;
  total_jobs: number | null;
  working_radius_km: number | null;
  years_experience: number | null;
};

type ReviewRow = {
  author_first_name: string | null;
  cleaner_id?: string | null;
  comment: string | null;
  created_at?: string | null;
  id?: string | null;
  overall_score?: number | null;
  postcode_prefix: string | null;
  service_type: string | null;
};

export function publicCleanerName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const first = parts[0] ?? fullName;
  const last = parts.length > 1 ? parts[parts.length - 1] : "";
  return last ? `${first} ${last.slice(0, 1).toUpperCase()}.` : first;
}

/** First name for booking `?pro=` (matches public profile book CTA). */
export function directoryCleanerProName(name: string) {
  return name.split(/\s+/)[0]?.replace(/\.$/, "") || name;
}

/** Keep service/category params; attach requested-pro booking context. */
export function bookingHrefWithDirectoryCleaner(
  baseHref: string,
  cleaner: Pick<DirectoryCleaner, "name" | "prefixes">,
) {
  if (!baseHref.startsWith("/booking/new")) return baseHref;
  const url = new URL(baseHref, "https://mundoria.local");
  url.searchParams.set("pro", directoryCleanerProName(cleaner.name));
  const cover = cleaner.prefixes
    .map((prefix) => prefix.toUpperCase())
    .filter(Boolean)
    .join(",");
  if (cover) url.searchParams.set("cover", cover);
  else url.searchParams.delete("cover");
  return `${url.pathname}${url.search}`;
}

function directoryClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    // Next.js caches `fetch` by default; stale marketing rows caused profile
    // 404s after seed renames (cards refreshed, profile routes did not).
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

function areaNameForPrefix(prefix: string) {
  const match = BIRMINGHAM_POSTCODES.find(
    (item) => item.prefix.toUpperCase() === prefix.toUpperCase(),
  );
  if (!match) return null;
  return (
    match.name ||
    BIRMINGHAM_AREAS.find((area) => area.slug === match.areaSlug)?.name ||
    null
  );
}

function areaSlugForPrefixes(prefixes: string[]) {
  for (const prefix of prefixes) {
    const match = BIRMINGHAM_POSTCODES.find(
      (item) => item.prefix.toUpperCase() === prefix.toUpperCase(),
    );
    if (match) return match.areaSlug;
  }
  return BIRMINGHAM_AREAS[0]?.slug ?? "birmingham";
}

export function cleanerPublicPath(
  name: string,
  areaSlug: string,
  id?: string,
) {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "cleaner";
  // Stable unique suffix so profiles resolve even when names collide.
  const suffix = id
    ? `-${id.replace(/-/g, "").slice(0, 8).toLowerCase()}`
    : "";
  return `/cleaners/${LAUNCH_CITY.slug}/${areaSlug}/profile/${base}${suffix}`;
}

function serviceLabel(value: string) {
  return SERVICES.find((service) => service.value === value)?.label ?? value;
}

function toCleaner(row: CleanerRow): DirectoryCleaner {
  const prefixes = (row.postcode_prefixes ?? []).filter(
    (prefix) => prefix.toUpperCase() !== "B",
  );
  const areaNames = Array.from(
    new Set(
      prefixes
        .map(areaNameForPrefix)
        .filter((name): name is string => Boolean(name)),
    ),
  );
  const areaSlug = areaSlugForPrefixes(prefixes);
  const homeArea = areaNames[0] ?? "Birmingham";
  const radiusMiles = milesFromRadiusKm(row.working_radius_km);
  const bio = row.bio?.trim() || "Independent cleaner covering Birmingham.";
  return {
    areas: areaNames.length ? areaNames.join(" · ") : "Birmingham",
    avatarUrl: row.avatar_url,
    bio:
      radiusMiles == null ? bio : bioWithCoverage(bio, radiusMiles, homeArea),
    href: cleanerPublicPath(row.full_name, areaSlug, row.id),
    id: row.id,
    jobs: row.total_jobs ?? 0,
    name: publicCleanerName(row.full_name),
    prefixes,
    radiusMiles,
    rating: Number(row.rating ?? 0),
    reviewCount: 0,
    services: (row.service_types ?? []).slice(0, 4).map(serviceLabel),
    years: row.years_experience,
  };
}

/** Drop em/en dashes from publishable review copy (seed + live). */
function sanitizeReviewBody(comment: string) {
  return comment
    .replace(/\s*[\u2014\u2013]\s*/g, ". ")
    .replace(/\.\s+\./g, ".")
    .replace(/([.!?])\s+([a-z])/g, (_, end: string, letter: string) => `${end} ${letter.toUpperCase()}`)
    .trim();
}

function toReview(row: ReviewRow): DirectoryReview | null {
  if (!row.comment) return null;
  const area = row.postcode_prefix ? areaNameForPrefix(row.postcode_prefix) : null;
  const first = row.author_first_name?.trim() || "Customer";
  const place = area || "Birmingham";
  const created = row.created_at ? new Date(row.created_at) : null;
  return {
    author: `${first} (${place})`,
    body: sanitizeReviewBody(row.comment),
    score: row.overall_score == null ? null : Number(row.overall_score),
    service: row.service_type ? serviceLabel(row.service_type) : "Cleaning",
    when:
      created && !Number.isNaN(created.getTime())
        ? formatDistanceToNow(created, { addSuffix: true })
        : null,
  };
}

export async function loadDirectoryCleaners(options?: {
  areaSlug?: string;
  limit?: number;
  prefix?: string;
  serviceType?: string;
  serviceTypes?: string[];
}) {
  const client = directoryClient();
  if (!client) return null;

  const limit = options?.limit ?? 6;
  const prefixes = options?.prefix
    ? [options.prefix.toUpperCase()]
    : options?.areaSlug
      ? prefixesForArea(options.areaSlug)
      : BIRMINGHAM_POSTCODES.map((item) => item.prefix);
  const serviceTypes = options?.serviceType
    ? [options.serviceType]
    : options?.serviceTypes?.filter(Boolean);

  const columns =
    "id, full_name, avatar_url, bio, rating, total_jobs, years_experience, working_radius_km, postcode_prefixes, service_types";
  const columnsWithoutRadius =
    "id, full_name, avatar_url, bio, rating, total_jobs, years_experience, postcode_prefixes, service_types";

  let query = client
    .from("marketing_cleaners")
    .select(columns)
    .overlaps("postcode_prefixes", prefixes)
    .order("rating", { ascending: false })
    .limit(Math.max(limit, 12));

  if (serviceTypes?.length === 1) {
    query = query.contains("service_types", [serviceTypes[0]]);
  } else if (serviceTypes && serviceTypes.length > 1) {
    query = query.overlaps("service_types", serviceTypes);
  }

  let { data, error } = await query;
  if (error) {
    let fallback = client
      .from("marketing_cleaners")
      .select(columnsWithoutRadius)
      .overlaps("postcode_prefixes", prefixes)
      .order("rating", { ascending: false })
      .limit(Math.max(limit, 12));
    if (serviceTypes?.length === 1) {
      fallback = fallback.contains("service_types", [serviceTypes[0]]);
    } else if (serviceTypes && serviceTypes.length > 1) {
      fallback = fallback.overlaps("service_types", serviceTypes);
    }
    const retry = await fallback;
    data = (retry.data ?? null) as typeof data;
    error = retry.error;
  }
  if (error || !data) return null;

  const cleaners = (data as CleanerRow[]).map(toCleaner);
  const unique = new Map<string, DirectoryCleaner>();
  for (const cleaner of cleaners) unique.set(cleaner.id, cleaner);
  const withReviews = await attachReviewCounts(
    withUniqueProfileHrefs(Array.from(unique.values())),
  );
  return interleaveByGender(withReviews).slice(0, limit);
}

/** Alternate woman / man so rating sort alone does not stack women first. */
function interleaveByGender(cleaners: DirectoryCleaner[]) {
  const women: DirectoryCleaner[] = [];
  const men: DirectoryCleaner[] = [];
  for (const cleaner of cleaners) {
    if (guessWoman(cleaner)) women.push(cleaner);
    else men.push(cleaner);
  }
  const out: DirectoryCleaner[] = [];
  const n = Math.max(women.length, men.length);
  for (let i = 0; i < n; i += 1) {
    if (women[i]) out.push(women[i]);
    if (men[i]) out.push(men[i]);
  }
  return out;
}

function guessWoman(cleaner: DirectoryCleaner) {
  const avatar = cleaner.avatarUrl?.toLowerCase() ?? "";
  if (avatar.includes("woman")) return true;
  if (avatar.includes("man") && !avatar.includes("woman")) return false;
  const first = (cleaner.name.split(/\s+/)[0] ?? "").toLowerCase();
  return WOMAN_FIRST_NAMES.has(first);
}

const WOMAN_FIRST_NAMES = new Set(
  [
    "amara",
    "priya",
    "olivia",
    "fatima",
    "elena",
    "hannah",
    "sophie",
    "aisha",
    "grace",
    "mei",
    "nia",
    "chloe",
    "freya",
    "yasmin",
    "lucy",
    "hana",
    "ruth",
    "zara",
    "imogen",
    "leila",
    "maya",
    "nora",
    "isla",
    "keisha",
  ].map((name) => name.toLowerCase()),
);

function withUniqueProfileHrefs(cleaners: DirectoryCleaner[]) {
  const used = new Map<string, number>();
  return cleaners.map((cleaner) => {
    const seen = used.get(cleaner.href) ?? 0;
    used.set(cleaner.href, seen + 1);
    if (seen === 0) return cleaner;
    return { ...cleaner, href: `${cleaner.href}-${seen + 1}` };
  });
}

async function attachReviewCounts(cleaners: DirectoryCleaner[]) {
  const client = directoryClient();
  if (!client || !cleaners.length) return cleaners;
  const { data } = await client
    .from("marketing_reviews")
    .select("id, cleaner_id")
    .in(
      "cleaner_id",
      cleaners.map((cleaner) => cleaner.id),
    )
    .limit(2000);
  const counts = new Map<string, number>();
  const seenRatings = new Set<string>();
  for (const row of data ?? []) {
    const typed = row as { cleaner_id?: string; id?: string };
    const id = typed.cleaner_id;
    if (!id) continue;
    const ratingKey = typed.id ?? `${id}:${seenRatings.size}`;
    if (seenRatings.has(ratingKey)) continue;
    seenRatings.add(ratingKey);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return cleaners.map((cleaner) => {
    const reviewCount = counts.get(cleaner.id) ?? 0;
    return {
      ...cleaner,
      // Keep jobs/rating honest with publishable reviews.
      jobs: reviewCount > 0 ? cleaner.jobs : Math.min(cleaner.jobs, 3),
      rating: reviewCount > 0 ? cleaner.rating : 0,
      reviewCount,
    };
  });
}

function cleanerSlugId(slug: string) {
  const match = slug.match(/-([a-f0-9]{8})$/i);
  return match?.[1]?.toLowerCase() ?? null;
}

export async function loadDirectoryCleaner(slug: string, areaSlug: string) {
  const needle = cleanerSlugId(slug);

  // Prefer id suffix (stable), then area list, then city-wide — avoids 404s when
  // area-filtered queries miss a cleaner that the card linked to.
  const pools = [
    await loadDirectoryCleaners({ areaSlug, limit: 80 }),
    await loadDirectoryCleaners({ limit: 80 }),
  ];

  for (const cleaners of pools) {
    if (!cleaners?.length) continue;
    if (needle) {
      const byId = cleaners.find((cleaner) =>
        cleaner.id.replace(/-/g, "").toLowerCase().startsWith(needle),
      );
      if (byId) return byId;
    }
    const exact = cleaners.find((cleaner) =>
      cleaner.href.endsWith(`/profile/${slug}`),
    );
    if (exact) return exact;
    const byTail = cleaners.find((cleaner) => {
      const pathSlug = cleaner.href.split("/").pop() ?? "";
      return pathSlug === slug || pathSlug.startsWith(`${slug}-`);
    });
    if (byTail) return byTail;
  }

  return null;
}

export async function loadDirectoryReviews(options?: {
  areaSlug?: string;
  cleanerId?: string;
  limit?: number;
  prefix?: string;
  /** Single booking service_type, e.g. "regular". */
  serviceType?: string;
  /** Several service types (category pages). */
  serviceTypes?: string[];
}) {
  const client = directoryClient();
  if (!client) return null;

  const prefixes = options?.prefix
    ? [options.prefix.toUpperCase()]
    : options?.areaSlug
      ? prefixesForArea(options.areaSlug)
      : options?.cleanerId
        ? null
        : BIRMINGHAM_POSTCODES.map((item) => item.prefix);

  const serviceTypes = options.serviceType
    ? [options.serviceType]
    : options.serviceTypes?.filter(Boolean);

  // Over-fetch when filtering by service so a sparse category still fills the layout.
  const fetchLimit =
    serviceTypes?.length && !options?.cleanerId
      ? Math.max((options?.limit ?? 6) * 4, 24)
      : (options?.limit ?? 6);

  let query = client
    .from("marketing_reviews")
    .select(
      "id, author_first_name, cleaner_id, comment, created_at, overall_score, postcode_prefix, service_type",
    )
    .order("created_at", { ascending: false })
    .limit(fetchLimit);

  if (options?.cleanerId) {
    query = query.eq("cleaner_id", options.cleanerId);
  } else if (prefixes) {
    query = query.in("postcode_prefix", prefixes);
  }

  if (serviceTypes?.length === 1) {
    query = query.eq("service_type", serviceTypes[0]);
  } else if (serviceTypes && serviceTypes.length > 1) {
    query = query.in("service_type", serviceTypes);
  }

  const { data, error } = await query;

  if (error || !data) return null;
  // Guard against legacy view joins that multiplied one rating per working area.
  const seen = new Set<string>();
  const unique = (data as ReviewRow[]).filter((row) => {
    const key = row.id ?? `${row.comment}|${row.created_at}|${row.author_first_name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return unique
    .map(toReview)
    .filter((review): review is DirectoryReview => Boolean(review))
    .slice(0, options?.limit ?? 6);
}

/**
 * Only reviews left by customers after a real, applied booking.
 * There is deliberately no placeholder fallback: invented or curated
 * testimonials presented as customer reviews are unlawful in the UK
 * (DMCC Act 2024) and against Google's review policies.
 */
export function publishedReviews(
  live: DirectoryReview[] | null,
  limit = 6,
): DirectoryReview[] {
  return (live ?? []).filter((review) => review.body.trim()).slice(0, limit);
}
