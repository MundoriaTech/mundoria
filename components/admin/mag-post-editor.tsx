"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { EditorialBody } from "@/components/marketing/editorial-body";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { renderEditorialBlocks } from "@/lib/content/editorial";
import {
  DEFAULT_MAG_AUTHOR,
  MAG_POST_CATEGORIES,
  type MagPostAdminRow,
  slugifyMagTitle,
} from "@/lib/content/mag-admin";
import { magThemeFor } from "@/lib/content/mag-theme";
import { cn } from "@/lib/utils";

type MagForm = {
  author_name: string;
  category: string;
  content: string;
  cover_url: string;
  excerpt: string;
  published: boolean;
  slug: string;
  title: string;
};

const HINTS = [
  { insert: "## ", label: "## H2" },
  { insert: "### ", label: "### H3" },
  { insert: "**bold**", label: "**bold**" },
  { insert: "- ", label: "- List" },
  { insert: "1. ", label: "1. Ordered" },
  { insert: "> ", label: "> Quote" },
  { insert: "> Tip: ", label: "> Tip" },
  {
    insert: "| Column | Column |\n| --- | --- |\n| Cell | Cell |\n",
    label: "Table",
  },
  { insert: '![Caption](/images/mag/welcome-mag.jpg "Caption")\n', label: "Image" },
];

function blankForm(): MagForm {
  return {
    author_name: DEFAULT_MAG_AUTHOR,
    category: MAG_POST_CATEGORIES[0] ?? "Company News",
    content: "",
    cover_url: "",
    excerpt: "",
    published: false,
    slug: "",
    title: "",
  };
}

function fromPost(post: MagPostAdminRow): MagForm {
  return {
    author_name: post.author_name || DEFAULT_MAG_AUTHOR,
    category: post.category || MAG_POST_CATEGORIES[0] || "Company News",
    content: post.content || "",
    cover_url: post.cover_url || "",
    excerpt: post.excerpt || "",
    published: post.published,
    slug: post.slug,
    title: post.title,
  };
}

export function MagPostEditor({
  post,
}: {
  post?: MagPostAdminRow | null;
}) {
  const router = useRouter();
  const isEdit = Boolean(post?.id);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [slugLocked, setSlugLocked] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<MagForm>(
    post ? fromPost(post) : blankForm(),
  );

  function setField<K extends keyof MagForm>(key: K, value: MagForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleTitle(value: string) {
    setField("title", value);
    if (!slugLocked) setField("slug", slugifyMagTitle(value));
  }

  function insertHint(snippet: string) {
    const el = textareaRef.current;
    if (!el) {
      setField("content", `${form.content}${snippet}`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next =
      form.content.slice(0, start) + snippet + form.content.slice(end);
    setField("content", next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + snippet.length;
      el.setSelectionRange(cursor, cursor);
    });
  }

  async function save(publish: boolean) {
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    const slug = slugifyMagTitle(form.slug) || slugifyMagTitle(form.title);
    if (!slug) {
      setError("Slug is required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/mag", {
        body: JSON.stringify({
          action: isEdit ? "update" : "create",
          author_name: form.author_name.trim() || DEFAULT_MAG_AUTHOR,
          category: form.category,
          content: form.content,
          cover_url: form.cover_url.trim() || null,
          excerpt: form.excerpt.trim() || null,
          id: post?.id,
          published: publish,
          slug,
          title: form.title.trim(),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        id?: string;
      };
      if (!response.ok) {
        setError(result.error ?? "Could not save post.");
        return;
      }
      router.push("/admin/mag");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const theme = magThemeFor(form.category);
  const previewBlocks = renderEditorialBlocks(form.content);

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-[#f7f4fb]">
      <div className="sticky top-0 z-30 border-b border-white/10 bg-[#1c133b] px-4 py-3 text-white sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0">
            <Link
              className="text-xs font-medium text-white/70 hover:text-white"
              href="/admin/mag"
            >
              ← Mag desk
            </Link>
            <p className="truncate text-sm font-semibold sm:text-base">
              {isEdit ? "Edit Mag post" : "New Mag post"}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              className="rounded-full border-white/30 bg-transparent text-white hover:bg-white/10"
              disabled={saving}
              onClick={() => save(false)}
              type="button"
              variant="outline"
            >
              Save draft
            </Button>
            <Button
              className="rounded-full bg-[#d4694a] text-white hover:bg-[#c45a3c]"
              disabled={saving}
              onClick={() => save(true)}
              type="button"
            >
              {saving ? "Saving…" : "Publish"}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-7 lg:py-8">
        <div className="space-y-4">
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <section className="rounded-[1.25rem] border border-[#e8e0f4] bg-white p-5 shadow-sm sm:p-6">
            <input
              className="w-full border-0 bg-transparent text-2xl font-semibold tracking-tight text-[#1c133b] outline-none placeholder:text-[#c4bdd8] sm:text-3xl"
              onChange={(event) => handleTitle(event.target.value)}
              placeholder="Post title…"
              value={form.title}
            />
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-[#5a5470]">/blog/</span>
              <Input
                className="h-9 max-w-xs font-mono text-xs"
                onChange={(event) => {
                  setSlugLocked(true);
                  setField("slug", slugifyMagTitle(event.target.value));
                }}
                value={form.slug}
              />
              <button
                className="text-xs font-semibold text-[#6a45b8] underline-offset-2 hover:underline"
                onClick={() => {
                  setSlugLocked(false);
                  setField("slug", slugifyMagTitle(form.title));
                }}
                type="button"
              >
                Reset from title
              </button>
            </div>
          </section>

          <section className="overflow-hidden rounded-[1.25rem] border border-[#e8e0f4] bg-white shadow-sm">
            <div className="flex border-b border-[#eee8f7]">
              {(
                [
                  ["write", "Write"],
                  ["preview", "Preview"],
                ] as const
              ).map(([id, label]) => (
                <button
                  className={cn(
                    "flex-1 px-4 py-3 text-sm font-semibold transition",
                    tab === id
                      ? "border-b-2 border-[#1c133b] text-[#1c133b]"
                      : "text-[#5a5470] hover:text-[#1c133b]",
                  )}
                  key={id}
                  onClick={() => setTab(id)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "write" ? (
              <div className="p-4 sm:p-5">
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {HINTS.map((hint) => (
                    <button
                      className="rounded-full border border-[#e0d6f0] bg-[#faf8fd] px-2.5 py-1 font-mono text-[11px] text-[#5a5470] hover:border-[#6a45b8]/40 hover:text-[#1c133b]"
                      key={hint.label}
                      onClick={() => insertHint(hint.insert)}
                      type="button"
                    >
                      {hint.label}
                    </button>
                  ))}
                </div>
                <textarea
                  className="min-h-[26rem] w-full resize-y rounded-xl border border-[#e8e0f4] bg-[#fcfbfe] px-4 py-3 font-mono text-sm leading-6 text-[#1c133b] outline-none focus:border-[#6a45b8]/50"
                  onChange={(event) => setField("content", event.target.value)}
                  placeholder="Write your Mag story in markdown…"
                  ref={textareaRef}
                  value={form.content}
                />
              </div>
            ) : (
              <div className="min-h-[26rem] px-4 py-6 sm:px-8">
                {form.content.trim() ? (
                  <EditorialBody
                    accent={theme.accent}
                    blocks={previewBlocks}
                  />
                ) : (
                  <p className="italic text-[#a39bb8]">
                    Start writing to see a live Mag preview…
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="rounded-[1.25rem] border border-[#e8e0f4] bg-white p-5 shadow-sm">
            <label className="text-sm font-semibold text-[#1c133b]">
              Excerpt
            </label>
            <p className="mt-1 text-xs text-[#5a5470]">
              Short blurb for the Mag listing and social previews.
            </p>
            <textarea
              className="mt-3 min-h-[6rem] w-full rounded-xl border border-[#e8e0f4] px-3 py-2 text-sm leading-6 outline-none focus:border-[#6a45b8]/50"
              onChange={(event) => setField("excerpt", event.target.value)}
              placeholder="One or two sentences…"
              value={form.excerpt}
            />
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <section className="rounded-[1.25rem] border border-[#e8e0f4] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#1c133b]">Status</p>
            <button
              className={cn(
                "mt-3 flex w-full items-center justify-between rounded-full px-4 py-2.5 text-sm font-semibold ring-1 transition",
                form.published
                  ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                  : "bg-amber-50 text-amber-900 ring-amber-200",
              )}
              onClick={() => setField("published", !form.published)}
              type="button"
            >
              <span>{form.published ? "Published" : "Draft"}</span>
              <span className="text-xs opacity-70">Tap to toggle</span>
            </button>
          </section>

          <section className="rounded-[1.25rem] border border-[#e8e0f4] bg-white p-5 shadow-sm">
            <label className="text-sm font-semibold text-[#1c133b]">
              Category
            </label>
            <select
              className="mt-2 w-full rounded-xl border border-[#e8e0f4] bg-white px-3 py-2.5 text-sm text-[#1c133b]"
              onChange={(event) => setField("category", event.target.value)}
              value={form.category}
            >
              {MAG_POST_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <label className="mt-4 block text-sm font-semibold text-[#1c133b]">
              Author
            </label>
            <Input
              className="mt-2"
              onChange={(event) => setField("author_name", event.target.value)}
              value={form.author_name}
            />
          </section>

          <section className="rounded-[1.25rem] border border-[#e8e0f4] bg-white p-5 shadow-sm">
            <label className="text-sm font-semibold text-[#1c133b]">
              Cover image URL
            </label>
            <p className="mt-1 text-xs text-[#5a5470]">
              Use a site path like `/images/mag/…` or a full URL.
            </p>
            <Input
              className="mt-2"
              onChange={(event) => setField("cover_url", event.target.value)}
              placeholder="/images/mag/welcome-mag.jpg"
              value={form.cover_url}
            />
            {form.cover_url ? (
              <div className="mt-3 overflow-hidden rounded-xl ring-1 ring-black/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  className="aspect-[16/10] w-full object-cover"
                  src={form.cover_url}
                />
              </div>
            ) : (
              <div
                className="mt-3 aspect-[16/10] rounded-xl"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${theme.accent} 0%, #823fb2 55%, #f0a888 100%)`,
                }}
              />
            )}
          </section>

          <div className="flex gap-2 lg:hidden">
            <Button
              className="flex-1 rounded-full"
              disabled={saving}
              onClick={() => save(false)}
              type="button"
              variant="outline"
            >
              Save draft
            </Button>
            <Button
              className="flex-1 rounded-full bg-[#d4694a] hover:bg-[#c45a3c]"
              disabled={saving}
              onClick={() => save(true)}
              type="button"
            >
              Publish
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
