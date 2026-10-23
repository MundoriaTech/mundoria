import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { logAdminAction, requireAdmin } from "@/lib/admin/auth";

const schema = z
  .object({
    admin_notes: z.string().trim().max(4000).nullish(),
    riddor_required: z.boolean().optional(),
    status: z
      .enum(["submitted", "under_review", "action_required", "resolved", "closed"])
      .optional(),
  })
  .refine(
    (value) =>
      value.status !== undefined ||
      value.admin_notes !== undefined ||
      value.riddor_required !== undefined,
    { message: "Nothing to update." },
  );

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }
  const input = parsed.data;

  const { data: current, error: loadError } = await auth.admin
    .from("cleaner_incidents")
    .select("id,status,riddor_required,riddor_recorded_at,resolved_at")
    .eq("id", params.id)
    .maybeSingle();
  if (loadError) {
    Sentry.captureException(loadError);
    return NextResponse.json({ error: loadError.message }, { status: 500 });
  }
  if (!current) {
    return NextResponse.json({ error: "Incident not found." }, { status: 404 });
  }

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updated_at: now };
  if (input.admin_notes !== undefined) {
    updates.admin_notes = input.admin_notes?.trim() || null;
  }
  if (input.status) {
    updates.status = input.status;
    if (input.status === "resolved" || input.status === "closed") {
      updates.resolved_at = current.resolved_at ?? now;
    } else {
      updates.resolved_at = null;
    }
  }
  if (input.riddor_required !== undefined) {
    updates.riddor_required = input.riddor_required;
    if (input.riddor_required && !current.riddor_recorded_at) {
      updates.riddor_recorded_at = now;
    }
    if (!input.riddor_required) updates.riddor_recorded_at = null;
  }

  const { data: updated, error } = await auth.admin
    .from("cleaner_incidents")
    .update(updates)
    .eq("id", params.id)
    .select("*")
    .single();
  if (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  try {
    await logAdminAction({
      action: "update_incident",
      adminId: auth.user.id,
      entityId: params.id,
      entityType: "cleaner_incident",
      metadata: {
        riddor_required: input.riddor_required,
        status: input.status,
      },
      reason: input.admin_notes?.trim() || "Incident updated",
    });
  } catch (logError) {
    Sentry.captureException(logError);
  }

  revalidatePath("/admin/incidents");
  revalidatePath(`/admin/incidents/${params.id}`);
  return NextResponse.json({ incident: updated, success: true });
}
