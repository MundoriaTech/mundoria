import { createClient } from "@supabase/supabase-js";
import { formatDistanceToNow } from "date-fns";

import { SERVICES } from "@/lib/customer/services";
import {
  BIRMINGHAM_AREAS,
  BIRMINGHAM_POSTCODES,
  LAUNCH_CITY,
  prefixesForArea,
} from "@/lib/seo/marketing";
import { BIRMINGHAM_LOCATION_REVIEWS } from "@/lib/seo/location-social-proof";

export type DirectoryCleaner = {
  areas: string;
  avatarUrl: string | null;
  bio: string;
  href: string;
  id: string;
  jobs: number;
  name: string;
  prefixes: string[];
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
  years_experience: number | null;
};

type ReviewRow = {
  author_first_name: string | null;
  cleaner_id?: string | null;
  comment: string | null;
  created_at?: string | null;
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

function directoryClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function areaNameForPrefix(prefix: string) {
  const match = BIRMINGHAM_POSTCODES.find(
    (item) => item.prefix.toUpperCase() === prefix.toUpperCase(),
  );
  if (!match) return null;
  return BIRMINGHAM_AREAS.find((area) => area.slug === match.areaSlug)?.name ?? null;
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

export function cleanerPublicPath(name: string, id: string, areaSlug: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const short = id.replace(/-/g, "").slice(0, 8);
  return `/cleaners/${LAUNCH_CITY.slug}/${areaSlug}/profile/${base}-${short}`;
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
  return {
    areas: areaNames.length ? areaNames.join(" · ") : "Birmingham",
    avatarUrl: row.avatar_url,
    bio: row.bio?.trim() || "Independent cleaner covering Birmingham.",
    href: cleanerPublicPath(row.full_name, row.id, areaSlug),
    id: row.id,
    jobs: row.total_jobs ?? 0,
    name: publicCleanerName(row.full_name),
    prefixes,
    rating: Number(row.rating ?? 0),
    reviewCount: 0,
    services: (row.service_types ?? []).slice(0, 4).map(serviceLabel),
    years: row.years_experience,
  };
}

function toReview(row: ReviewRow): DirectoryReview | null {
  if (!row.comment) return null;
  const area = row.postcode_prefix ? areaNameForPrefix(row.postcode_prefix) : null;
  const first = row.author_first_name?.trim() || "Customer";
  const prefix = row.postcode_prefix?.toUpperCase() ?? "";
  const place = area
    ? prefix
      ? `${area}, ${prefix}`
      : area
    : prefix || "Birmingham";
  const created = row.created_at ? new Date(row.created_at) : null;
  return {
    author: `${first} (${place})`,
    body: row.comment,
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
}) {
  const client = directoryClient();
  if (!client) return null;

  const limit = options?.limit ?? 6;
  const prefixes = options?.prefix
    ? [options.prefix.toUpperCase()]
    : options?.areaSlug
      ? prefixesForArea(options.areaSlug)
      : BIRMINGHAM_POSTCODES.map((item) => item.prefix);

  let query = client
    .from("marketing_cleaners")
    .select(
      "id, full_name, avatar_url, bio, rating, total_jobs, years_experience, postcode_prefixes, service_types",
    )
    .overlaps("postcode_prefixes", prefixes)
    .order("rating", { ascending: false })
    .limit(Math.max(limit, 12));

  if (options?.serviceType) {
    query = query.contains("service_types", [options.serviceType]);
  }

  const { data, error } = await query;
  if (error || !data) return null;

  const cleaners = (data as CleanerRow[]).map(toCleaner);
  const unique = new Map<string, DirectoryCleaner>();
  for (const cleaner of cleaners) unique.set(cleaner.id, cleaner);
  return attachReviewCounts(Array.from(unique.values()).slice(0, limit));
}

async function attachReviewCounts(cleaners: DirectoryCleaner[]) {
  const client = directoryClient();
  if (!client || !cleaners.length) return cleaners;
  const { data } = await client
    .from("marketing_reviews")
    .select("cleaner_id")
    .in(
      "cleaner_id",
      cleaners.map((cleaner) => cleaner.id),
    )
    .limit(2000);
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const id = (row as { cleaner_id?: string }).cleaner_id;
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return cleaners.map((cleaner) => ({
    ...cleaner,
    reviewCount: counts.get(cleaner.id) ?? 0,
  }));
}

export async function loadDirectoryCleaner(shortId: string, areaSlug: string) {
  const cleaners = await loadDirectoryCleaners({ areaSlug, limit: 80 });
  if (!cleaners) return null;
  const needle = shortId.toLowerCase();
  return (
    cleaners.find((cleaner) =>
      cleaner.id.replace(/-/g, "").toLowerCase().startsWith(needle),
    ) ?? null
  );
}

export async function loadDirectoryReviews(options?: {
  areaSlug?: string;
  cleanerId?: string;
  limit?: number;
  prefix?: string;
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

  let query = client
    .from("marketing_reviews")
    .select(
      "author_first_name, cleaner_id, comment, created_at, overall_score, postcode_prefix, service_type",
    )
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 6);

  if (options?.cleanerId) {
    query = query.eq("cleaner_id", options.cleanerId);
  } else if (prefixes) {
    query = query.in("postcode_prefix", prefixes);
  }

  const { data, error } = await query;

  if (error || !data) return null;
  return (data as ReviewRow[])
    .map(toReview)
    .filter((review): review is DirectoryReview => Boolean(review));
}

export function reviewsOrFallback(
  live: DirectoryReview[] | null,
  limit = 6,
): DirectoryReview[] {
  const seeded = live?.filter((review) => review.body.trim()) ?? [];
  if (seeded.length >= 3) return seeded.slice(0, limit);
  const extras = BIRMINGHAM_LOCATION_REVIEWS.filter(
    (review) => !seeded.some((item) => item.body === review.body),
  ).map((review) => ({
    author: review.author,
    body: review.body,
    score: null,
    service: review.service,
    when: null,
  }));
  return [...seeded, ...extras].slice(0, limit);
}
