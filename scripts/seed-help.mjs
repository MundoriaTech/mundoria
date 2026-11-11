/**
 * Publish the Help Centre (scripts/help-content.mjs) to hosted Supabase.
 * Usage: npm run seed:help
 *
 * Unlike seed:content, this never touches blog_posts, so Mag posts edited in
 * /admin/mag are safe. Collections are upserted by id and articles by slug;
 * articles no longer in help-content.mjs are deleted. updated_at is bumped so
 * the sitemap's lastmod reflects the change.
 */
import { createClient } from "@supabase/supabase-js";
import { HELP_ARTICLES, HELP_COLLECTIONS } from "./help-content.mjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const now = new Date().toISOString();

  const { error: cErr } = await admin
    .from("help_collections")
    .upsert(HELP_COLLECTIONS, { onConflict: "id" });
  if (cErr) throw cErr;

  const { error: aErr } = await admin
    .from("help_articles")
    .upsert(
      HELP_ARTICLES.map((article) => ({ ...article, updated_at: now })),
      { onConflict: "slug" },
    );
  if (aErr) throw aErr;

  const keep = new Set(HELP_ARTICLES.map((article) => article.slug));
  const { data: existing, error: lErr } = await admin.from("help_articles").select("slug");
  if (lErr) throw lErr;
  const stale = (existing ?? []).map((row) => row.slug).filter((slug) => !keep.has(slug));
  if (stale.length) {
    const { error: dErr } = await admin.from("help_articles").delete().in("slug", stale);
    if (dErr) throw dErr;
  }

  console.log(
    `Help Centre published: ${HELP_COLLECTIONS.length} collections, ${HELP_ARTICLES.length} articles` +
      (stale.length ? `, removed ${stale.length} old (${stale.join(", ")})` : ""),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
