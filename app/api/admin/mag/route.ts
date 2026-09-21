import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { logAdminAction, requireAdmin } from "@/lib/admin/auth";
import {
  DEFAULT_MAG_AUTHOR,
  MAG_POST_CATEGORIES,
  slugifyMagTitle,
} from "@/lib/content/mag-admin";

const categoryEnum = z.enum(
  MAG_POST_CATEGORIES as unknown as [string, ...string[]],
);

const schema = z.object({
  action: z.enum(["create", "update", "toggle", "delete"]),
  author_name: z.string().trim().min(1).max(120).optional(),
  category: categoryEnum.optional(),
  content: z.string().max(200_000).optional(),
  cover_url: z.string().trim().max(2000).nullable().optional(),
  excerpt: z.string().trim().max(600).nullable().optional(),
  id: z.string().uuid().optional(),
  published: z.boolean().optional(),
  slug: z.string().trim().max(160).optional(),
  title: z.string().trim().max(200).optional(),
});

function revalidateMag(slug?: string | null) {
  revalidatePath("/blog");
  revalidatePath("/admin/mag");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/blog/${slug}`);
}

function cleanNullable(value: string | null | undefined) {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ??
          "Invalid Mundoria Mag post details.",
      },
      { status: 400 },
    );
  }

  const body = parsed.data;
  const now = new Date().toISOString();

  if (body.action === "delete") {
    if (!body.id) {
      return NextResponse.json({ error: "Post id is required." }, { status: 400 });
    }
    const { data: existing } = await auth.admin
      .from("blog_posts")
      .select("id, slug, title")
      .eq("id", body.id)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }
    const { error } = await auth.admin
      .from("blog_posts")
      .delete()
      .eq("id", body.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    await logAdminAction({
      action: "mag_post_delete",
      adminId: auth.user.id,
      entityId: body.id,
      entityType: "blog_post",
      metadata: { slug: existing.slug, title: existing.title },
      reason: "Deleted Mundoria Mag post",
    });
    revalidateMag(existing.slug);
    return NextResponse.json({ success: true });
  }

  if (body.action === "toggle") {
    if (!body.id || typeof body.published !== "boolean") {
      return NextResponse.json(
        { error: "Post id and published status are required." },
        { status: 400 },
      );
    }
    const { data: existing } = await auth.admin
      .from("blog_posts")
      .select("id, slug, published_at")
      .eq("id", body.id)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }
    const { error } = await auth.admin
      .from("blog_posts")
      .update({
        published: body.published,
        published_at: body.published
          ? (existing.published_at ?? now)
          : existing.published_at,
        updated_at: now,
      })
      .eq("id", body.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    await logAdminAction({
      action: body.published ? "mag_post_publish" : "mag_post_unpublish",
      adminId: auth.user.id,
      entityId: body.id,
      entityType: "blog_post",
      metadata: { published: body.published, slug: existing.slug },
    });
    revalidateMag(existing.slug);
    return NextResponse.json({ success: true });
  }

  const title = body.title?.trim() ?? "";
  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }
  if (!body.category) {
    return NextResponse.json(
      { error: "Category is required." },
      { status: 400 },
    );
  }

  const slug =
    slugifyMagTitle(body.slug ?? "") || slugifyMagTitle(title);
  if (!slug) {
    return NextResponse.json(
      { error: "Please add a title or slug." },
      { status: 400 },
    );
  }

  const published = Boolean(body.published);
  const payload = {
    author_name: body.author_name?.trim() || DEFAULT_MAG_AUTHOR,
    category: body.category,
    content: body.content ?? "",
    cover_url: cleanNullable(body.cover_url),
    excerpt: cleanNullable(body.excerpt),
    published,
    slug,
    title,
    updated_at: now,
  };

  if (body.action === "create") {
    const { data, error } = await auth.admin
      .from("blog_posts")
      .insert({
        ...payload,
        published_at: published ? now : null,
      })
      .select("id, slug")
      .single();
    if (error) {
      const message = /duplicate|unique/i.test(error.message)
        ? "That slug is already in use. Choose another."
        : error.message;
      return NextResponse.json({ error: message }, { status: 400 });
    }
    await logAdminAction({
      action: "mag_post_create",
      adminId: auth.user.id,
      entityId: data.id,
      entityType: "blog_post",
      metadata: { published, slug: data.slug },
    });
    revalidateMag(data.slug);
    return NextResponse.json({ id: data.id, success: true });
  }

  if (!body.id) {
    return NextResponse.json({ error: "Post id is required." }, { status: 400 });
  }

  const { data: existing } = await auth.admin
    .from("blog_posts")
    .select("id, slug, published_at")
    .eq("id", body.id)
    .maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  const { error } = await auth.admin
    .from("blog_posts")
    .update({
      ...payload,
      published_at: published
        ? (existing.published_at ?? now)
        : existing.published_at,
    })
    .eq("id", body.id);
  if (error) {
    const message = /duplicate|unique/i.test(error.message)
      ? "That slug is already in use. Choose another."
      : error.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await logAdminAction({
    action: "mag_post_update",
    adminId: auth.user.id,
    entityId: body.id,
    entityType: "blog_post",
    metadata: { published, slug },
  });
  revalidateMag(slug);
  if (existing.slug !== slug) revalidateMag(existing.slug);
  return NextResponse.json({ id: body.id, success: true });
}
