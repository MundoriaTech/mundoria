import { notFound } from "next/navigation";

import { MagPostEditor } from "@/components/admin/mag-post-editor";
import type { MagPostAdminRow } from "@/lib/content/mag-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  robots: { index: false, follow: false },
  title: "Edit Mag post | Admin",
};

type PageProps = { params: { id: string } };

export default async function AdminMagEditPage({ params }: PageProps) {
  const { data } = await createAdminClient()
    .from("blog_posts")
    .select(
      "id,title,slug,excerpt,content,category,cover_url,author_name,published,published_at,created_at,updated_at",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!data) notFound();

  return <MagPostEditor post={data as MagPostAdminRow} />;
}
