import { createPublicSupabaseClient } from "@/lib/supabase/public";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export type BlogPost = {
  author_name: string;
  category: string;
  content: string;
  cover_url: string | null;
  created_at: string;
  excerpt: string | null;
  id: string;
  published_at: string | null;
  slug: string;
  title: string;
};

export type HelpCollection = {
  audience: string;
  description: string;
  id: string;
  slug: string;
  sort_order: number;
  title: string;
};

export type HelpArticle = {
  body: string;
  collection_id: string;
  id: string;
  slug: string;
  sort_order: number;
  summary: string;
  title: string;
  topic: string;
};

export const BLOG_CATEGORIES = [
  "All",
  "Cleaning Tips",
  "Home Care",
  "Host Tips",
  "Birmingham Life",
  "Cleaner Stories",
  "Company News",
] as const;

export async function listPublishedBlogPosts(): Promise<BlogPost[]> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from("blog_posts")
      .select(
        "id,title,slug,excerpt,content,category,cover_url,author_name,published_at,created_at",
      )
      .eq("published", true)
      .order("published_at", { ascending: false });
    return (data as BlogPost[]) ?? [];
  } catch {
    return [];
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from("blog_posts")
      .select(
        "id,title,slug,excerpt,content,category,cover_url,author_name,published_at,created_at",
      )
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    return (data as BlogPost) ?? null;
  } catch {
    return null;
  }
}

export async function listRelatedBlogPosts(
  category: string,
  excludeSlug: string,
  limit = 3,
): Promise<BlogPost[]> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from("blog_posts")
      .select(
        "id,title,slug,excerpt,content,category,cover_url,author_name,published_at,created_at",
      )
      .eq("published", true)
      .eq("category", category)
      .neq("slug", excludeSlug)
      .order("published_at", { ascending: false })
      .limit(limit);
    return (data as BlogPost[]) ?? [];
  } catch {
    return [];
  }
}

export async function listHelpCollections(): Promise<HelpCollection[]> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from("help_collections")
      .select("id,title,slug,description,audience,sort_order")
      .order("sort_order", { ascending: true });
    return (data as HelpCollection[]) ?? [];
  } catch {
    return [];
  }
}

export async function getHelpCollectionBySlug(
  slug: string,
): Promise<HelpCollection | null> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from("help_collections")
      .select("id,title,slug,description,audience,sort_order")
      .eq("slug", slug)
      .maybeSingle();
    return (data as HelpCollection) ?? null;
  } catch {
    return null;
  }
}

export async function listHelpArticlesForCollection(
  collectionId: string,
): Promise<HelpArticle[]> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from("help_articles")
      .select("id,collection_id,title,slug,summary,body,topic,sort_order")
      .eq("collection_id", collectionId)
      .eq("published", true)
      .order("sort_order", { ascending: true });
    return ((data as HelpArticle[]) ?? []).map((article) => ({
      ...article,
      topic: article.topic ?? "",
    }));
  } catch {
    return [];
  }
}

export async function getHelpArticleBySlug(
  slug: string,
): Promise<(HelpArticle & { collection?: HelpCollection | null }) | null> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from("help_articles")
      .select(
        "id,collection_id,title,slug,summary,body,topic,sort_order,collection:help_collections(id,title,slug,description,audience,sort_order)",
      )
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (!data) return null;
    const row = data as HelpArticle & {
      collection: HelpCollection | HelpCollection[] | null;
    };
    return {
      ...row,
      topic: row.topic ?? "",
      collection: Array.isArray(row.collection)
        ? row.collection[0] ?? null
        : row.collection,
    };
  } catch {
    return null;
  }
}

/** Lightweight markdown-ish rendering for blog/help bodies (WeCasa Mag style). */
export function renderEditorialBlocks(text: string) {
  const lines = text.split("\n");
  const blocks: Array<{
    type:
      | "h2"
      | "h3"
      | "p"
      | "ul"
      | "ol"
      | "quote"
      | "tip"
      | "table"
      | "image";
    value:
      | string
      | string[]
      | { headers: string[]; rows: string[][] }
      | { alt: string; src: string; caption?: string };
  }> = [];
  let list: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let tableRows: string[][] = [];

  const flushList = () => {
    if (!list.length || !listType) return;
    blocks.push({ type: listType, value: [...list] });
    list = [];
    listType = null;
  };

  const flushTable = () => {
    if (!tableRows.length) return;
    const [headers, ...rest] = tableRows;
    const rows = rest.filter((row) => !row.every((cell) => /^[-: ]+$/.test(cell)));
    blocks.push({ type: "table", value: { headers, rows } });
    tableRows = [];
  };

  const flushAll = () => {
    flushList();
    flushTable();
  };

  for (const line of lines) {
    const ordered = line.match(/^\d+\.\s+(.*)$/);
    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/);
    if (line.startsWith("## ")) {
      flushAll();
      blocks.push({ type: "h2", value: line.slice(3) });
    } else if (line.startsWith("### ")) {
      flushAll();
      blocks.push({ type: "h3", value: line.slice(4) });
    } else if (imageMatch) {
      flushAll();
      blocks.push({
        type: "image",
        value: {
          alt: imageMatch[1] || "",
          caption: imageMatch[3],
          src: imageMatch[2],
        },
      });
    } else if (line.startsWith("> ")) {
      flushAll();
      const raw = line.slice(2).trim();
      if (/^(\*\*)?(Pro Tip|Tip|Important):?/i.test(raw)) {
        blocks.push({ type: "tip", value: raw.replace(/\*\*/g, "") });
      } else {
        blocks.push({ type: "quote", value: raw });
      }
    } else if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      flushList();
      const cells = line
        .trim()
        .slice(1, -1)
        .split("|")
        .map((cell) => cell.trim());
      tableRows.push(cells);
    } else if (line.startsWith("- ")) {
      flushTable();
      if (listType && listType !== "ul") flushList();
      listType = "ul";
      list.push(line.slice(2));
    } else if (ordered) {
      flushTable();
      if (listType && listType !== "ol") flushList();
      listType = "ol";
      list.push(ordered[1]);
    } else if (line.trim() === "") {
      flushAll();
    } else {
      flushAll();
      blocks.push({ type: "p", value: line });
    }
  }
  flushAll();
  return blocks;
}

export function editorialConfigured() {
  return hasSupabasePublicConfig();
}
