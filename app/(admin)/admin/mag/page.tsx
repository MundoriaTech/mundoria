import { MagPostsManager } from "@/components/admin/mag-posts-manager";
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
      "id,title,slug,excerpt,content,category,cover_url,author_name,published,published_at,created_at,updated_at",
    )
    .order("updated_at", { ascending: false });

  return (
    <div className="min-w-0">
      <h1 className="sr-only">Mundoria Mag</h1>
      <MagPostsManager posts={(data as MagPostAdminRow[]) ?? []} />
    </div>
  );
}
