"use client";

import { Newspaper, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { MagPostAdminRow } from "@/lib/content/mag-admin";
import { cn } from "@/lib/utils";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function MagPostsManager({ posts }: { posts: MagPostAdminRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MagPostAdminRow | null>(
    null,
  );
  const [toast, setToast] = useState<string | null>(null);

  const publishedCount = posts.filter((post) => post.published).length;
  const draftCount = posts.length - publishedCount;

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }

  async function runAction(payload: Record<string, unknown>, success: string) {
    setError(null);
    const id = typeof payload.id === "string" ? payload.id : null;
    setBusyId(id);
    try {
      const response = await fetch("/api/admin/mag", {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      showToast(success);
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-w-0">
      <div className="overflow-hidden rounded-[1.5rem] bg-[#1c133b] px-5 py-6 text-white sm:px-7 sm:py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f0a888]">
              Mundoria Mag
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Editorial desk
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
              Draft, preview, and publish guides for the Mag — same flow as a
              proper magazine CMS.
            </p>
          </div>
          <Button
            asChild
            className="rounded-full bg-[#d4694a] text-white hover:bg-[#c45a3c]"
          >
            <Link href="/admin/mag/new">
              <Plus className="mr-1.5 h-4 w-4" />
              New post
            </Link>
          </Button>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { label: "Total", value: posts.length },
            { label: "Published", value: publishedCount },
            { label: "Drafts", value: draftCount },
          ].map((stat) => (
            <div
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              key={stat.label}
            >
              <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
              <p className="mt-0.5 text-xs text-white/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {posts.length === 0 ? (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-[#d9ccef] bg-white px-6 py-16 text-center">
          <Newspaper className="mx-auto h-10 w-10 text-[#6a45b8]/50" />
          <p className="mt-4 text-lg font-semibold text-[#1c133b]">
            No Mag posts yet
          </p>
          <p className="mt-2 text-sm text-[#5a5470]">
            Write your first guide and publish it to Mundoria Mag.
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link href="/admin/mag/new">Create first post</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-6 hidden overflow-hidden rounded-[1.25rem] border bg-card md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Updated</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr className="border-b last:border-0" key={post.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#1c133b]">{post.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        /blog/{post.slug}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {post.category}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold transition",
                          post.published
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
                          busyId === post.id && "opacity-60",
                        )}
                        disabled={busyId === post.id}
                        onClick={() =>
                          runAction(
                            {
                              action: "toggle",
                              id: post.id,
                              published: !post.published,
                            },
                            post.published ? "Moved to drafts" : "Published",
                          )
                        }
                        type="button"
                      >
                        {post.published ? "Published" : "Draft"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(post.updated_at || post.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          className="rounded-full border px-3 py-1.5 text-xs font-semibold text-[#1c133b] hover:bg-muted"
                          href={`/admin/mag/${post.id}`}
                        >
                          Edit
                        </Link>
                        {post.published ? (
                          <a
                            className="rounded-full border px-3 py-1.5 text-xs font-semibold text-[#6a45b8] hover:bg-muted"
                            href={`/blog/${post.slug}`}
                            rel="noreferrer"
                            target="_blank"
                          >
                            View
                          </a>
                        ) : null}
                        <button
                          aria-label={`Delete ${post.title}`}
                          className="rounded-full border border-destructive/20 p-1.5 text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget(post)}
                          type="button"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 space-y-3 md:hidden">
            {posts.map((post) => (
              <article
                className="rounded-[1.25rem] border bg-card p-4"
                key={post.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1c133b]">{post.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {post.category} · {formatDate(post.updated_at)}
                    </p>
                  </div>
                  <button
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      post.published
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-800",
                    )}
                    disabled={busyId === post.id}
                    onClick={() =>
                      runAction(
                        {
                          action: "toggle",
                          id: post.id,
                          published: !post.published,
                        },
                        post.published ? "Moved to drafts" : "Published",
                      )
                    }
                    type="button"
                  >
                    {post.published ? "Live" : "Draft"}
                  </button>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link
                    className="flex-1 rounded-full border py-2 text-center text-xs font-semibold"
                    href={`/admin/mag/${post.id}`}
                  >
                    Edit
                  </Link>
                  <button
                    className="rounded-full border border-destructive/20 px-3 text-destructive"
                    onClick={() => setDeleteTarget(post)}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-[1.5rem] bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[#1c133b]">
              Delete this post?
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#5a5470]">
              “{deleteTarget.title}” will be permanently removed from Mundoria
              Mag.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button
                onClick={() => setDeleteTarget(null)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={busyId === deleteTarget.id}
                onClick={() =>
                  runAction(
                    { action: "delete", id: deleteTarget.id },
                    "Post deleted",
                  )
                }
                type="button"
                variant="destructive"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#1c133b] px-5 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
