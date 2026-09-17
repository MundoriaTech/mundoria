/**
 * Seed Mundoria Mag + Help Centre content into hosted Supabase.
 * Usage: node --env-file=.env.local scripts/seed-content.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { HELP_ARTICLES, HELP_COLLECTIONS } from "./help-content.mjs";
import { MAG_POSTS } from "./mag-posts.mjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const collections = HELP_COLLECTIONS;
const articles = HELP_ARTICLES;
const posts = MAG_POSTS;

async function main() {
  console.log("Seeding editorial content…");
  await admin.from("help_articles").delete().neq("slug", "__never__");
  await admin.from("help_collections").delete().neq("slug", "__never__");
  await admin.from("blog_posts").delete().neq("slug", "__never__");

  const { error: cErr } = await admin.from("help_collections").insert(collections);
  if (cErr) throw cErr;
  const { error: aErr } = await admin.from("help_articles").insert(articles);
  if (aErr) throw aErr;
  const { error: pErr } = await admin.from("blog_posts").insert(posts);
  if (pErr) throw pErr;

  console.log(
    `Done: ${collections.length} collections, ${articles.length} articles, ${posts.length} posts`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
