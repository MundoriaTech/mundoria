import { MagPostsManager } from "@/components/admin/mag-posts-manager";
import { AppPage } from "@/components/shared/app-page";
import { canonicalBlogCategory } from "@/lib/content/editorial";
import type { MagPostAdminRow } from "@/lib/content/mag-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  robots: { index: false, follow: false },
  title: "Mundoria Mag | Admin",
};

export default async function AdminMagPage() {
  const { data } = await createAdminClient()
    .from("blog_posts")
    .select(
      "id,title,slug,excerpt,content,category,cover_url,author_name,published,published_at,created_at,updated_at,related_services",
    )
    .order("updated_at", { ascending: false });

  return (
    <AppPage>
      <h1 className="sr-only">Mundoria Mag</h1>
      <MagPostsManager
        posts={((data as MagPostAdminRow[]) ?? []).map((post) => ({
          ...post,
          category: canonicalBlogCategory(post.category),
          related_services: Array.isArray(post.related_services)
            ? post.related_services
            : [],
        }))}
      />
    </AppPage>
  );
}
