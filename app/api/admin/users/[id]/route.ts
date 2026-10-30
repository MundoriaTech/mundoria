import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { logAdminAction, requireAdmin } from "@/lib/admin/auth";
import {
  getHardDeleteEligibility,
  hardDeleteBlockMessage,
  hardDeleteUnusedUser,
} from "@/lib/admin/delete-user";

const deleteSchema = z.object({
  reason: z.string().trim().min(3).max(500),
});

/** GET eligibility for hard-delete of a spam/unused account. */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const eligibility = await getHardDeleteEligibility({
    actorAdminId: auth.user.id,
    userId: params.id,
  });

  return NextResponse.json({
    allowed: eligibility.allowed,
    blockReason: eligibility.blockReason,
    message: eligibility.blockReason
      ? hardDeleteBlockMessage(eligibility.blockReason)
      : null,
    email: eligibility.email,
    fullName: eligibility.fullName,
    role: eligibility.role,
  });
}

/**
 * Hard-delete only when the account has no booking/payment/dispute history.
 * Admins and accounts with ops history are refused.
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ??
          "Add a short note (at least 3 characters) explaining why.",
      },
      { status: 400 },
    );
  }

  const eligibility = await getHardDeleteEligibility({
    actorAdminId: auth.user.id,
    userId: params.id,
  });

  if (!eligibility.allowed) {
    return NextResponse.json(
      {
        error: eligibility.blockReason
          ? hardDeleteBlockMessage(eligibility.blockReason)
          : "This account cannot be deleted.",
      },
      { status: 400 },
    );
  }

  try {
    await hardDeleteUnusedUser(params.id);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to delete account.",
      },
      { status: 500 },
    );
  }

  await logAdminAction({
    action: "user_hard_deleted",
    adminId: auth.user.id,
    entityId: params.id,
    entityType: "profile",
    metadata: {
      email: eligibility.email,
      full_name: eligibility.fullName,
      role: eligibility.role,
    },
    reason: parsed.data.reason,
  });

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/cleaners");
  revalidatePath(`/admin/customer/${params.id}`);
  revalidatePath(`/admin/cleaners/${params.id}`);

  return NextResponse.json({
    redirectTo:
      eligibility.role === "cleaner" ? "/admin/cleaners" : "/admin/customers",
    success: true,
  });
}
