import { BLOG_CATEGORIES } from "@/lib/content/editorial";

export const MAG_POST_CATEGORIES = BLOG_CATEGORIES.filter(
  (category) => category !== "All",
);

export const DEFAULT_MAG_AUTHOR = "Mundoria Team";

export type MagPostAdminRow = {
  author_name: string;
  category: string;
  content: string;
  cover_url: string | null;
  created_at: string;
  excerpt: string | null;
  id: string;
  published: boolean;
  published_at: string | null;
  slug: string;
  title: string;
  updated_at: string;
};

export function slugifyMagTitle(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
