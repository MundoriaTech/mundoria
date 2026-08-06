import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { logAdminAction, requireAdmin } from "@/lib/admin/auth";

const schema = z.object({
  action: z.enum(["approve", "reject", "suspend", "remove", "set_tier"]),
  reason: z.string().trim().min(3),
  tier: z.enum(["bronze", "silver", "gold", "rose_gold", "elite"]).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ??
          "A reason of at least 3 characters is required.",
      },
      { status: 400 },
    );
  }
  const { action, reason, tier } = parsed.data;
  const status =
    action === "approve"
      ? "certified"
      : action === "reject"
        ? "in_training"
        : action === "suspend"
          ? "suspended"
          : action === "remove"
            ? "removed"
            : undefined;
  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (action === "approve") {
    updates.dbs_verified = true;
    updates.id_verified = true;
    updates.dbs_document_status = "verified";
    updates.id_document_status = "verified";
    updates.certification_passed = true;
    updates.certification_notes = reason;
    updates.certification_assessed_by = auth.user.id;
    updates.certification_assessed_at = new Date().toISOString();
    updates.tier = "silver";
  }
  if (action === "reject") {
    updates.certification_passed = false;
    updates.certification_notes = reason;
    updates.certification_assessed_by = auth.user.id;
    updates.certification_assessed_at = new Date().toISOString();
  }
  if (action === "set_tier") {
    if (!tier) return NextResponse.json({ error: "Tier required" }, { status: 400 });
    updates.tier = tier;
    const { data: current } = await auth.admin
      .from("cleaner_profiles")
      .select("tier,performance_score,total_jobs")
      .eq("id", params.id)
      .single();
    await auth.admin.from("performance_history").insert({
      acceptance_score: 0,
      cancellation_score: 0,
      cleaner_id: params.id,
      jobs_completed: current?.total_jobs ?? 0,
      month: new Date().toISOString().slice(0, 7) + "-01",
      on_time_score: 0,
      rating_score: 0,
      tier_after: tier,
      tier_before: current?.tier ?? "bronze",
      total_score: current?.performance_score ?? 0,
    });
  }
  const { error } = await auth.admin
    .from("cleaner_profiles")
    .update(updates)
    .eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (action === "approve" || action === "reject") {
    await auth.admin.from("cleaner_medallion_events").insert({
      changed_by: auth.user.id,
      cleaner_id: params.id,
      event_type:
        action === "approve" ? "certification_passed" : "certification_failed",
      metadata: {},
      notes: reason,
      score_delta: 0,
      tier_after: action === "approve" ? "silver" : null,
    });
  }

  await logAdminAction({
    action,
    adminId: auth.user.id,
    entityId: params.id,
    entityType: "cleaner",
    metadata: tier ? { tier } : {},
    reason,
  });
  await auth.admin.from("notifications").insert({
    body:
      action === "approve"
        ? "You are approved and can now receive cleaning jobs."
        : action === "reject"
          ? "Your application is on hold. CleanScape will follow up if more is needed."
          : action === "suspend"
            ? "Your cleaner account has been temporarily suspended."
            : action === "remove"
              ? "Your cleaner account has been removed from CleanScape."
              : `Your cleaner account was updated: ${action}.`,
    data: {},
    title:
      action === "approve"
        ? "You're approved"
        : action === "reject"
          ? "Application on hold"
          : "Account update",
    type: `cleaner_${action}`,
    user_id: params.id,
  });

  revalidatePath(`/admin/cleaner/${params.id}`);
  revalidatePath("/admin/cleaners");
  revalidatePath("/admin/dashboard");

  return NextResponse.json({ success: true });
}
