import { NextResponse } from "next/server";
import { z } from "zod";

import { CLEANER_DOCUMENT_LABELS, documentStatusColumn } from "@/lib/cleaner/document-reviews";
import { MAX_DBS_DOCUMENT_PAGES } from "@/lib/cleaner/document-urls";
import {
  normaliseShareCode,
  rightToWorkIssue,
} from "@/lib/cleaner/right-to-work";
import { alertAdmins } from "@/lib/notifications/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-client";

/**
 * After onboarding, a cleaner replaces one rejected, missing or expired
 * document (or adds right-to-work details). Only that item goes back to
 * "pending" for an admin to review; everything already approved stays.
 */
const schema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.enum(["id", "dbs", "utr"]),
    paths: z.array(z.string().trim().min(1)).min(1).max(MAX_DBS_DOCUMENT_PAGES),
  }),
  z.object({
    expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    kind: z.literal("insurance"),
    paths: z.array(z.string().trim().min(1)).length(1),
  }),
  z.object({
    date_of_birth: z.string().trim(),
    kind: z.literal("right_to_work"),
    right_to_work_expires_on: z.string().trim().optional().default(""),
    right_to_work_route: z.enum(["british_irish", "share_code"]),
    right_to_work_share_code: z.string().trim().optional().default(""),
    right_to_work_visa_type: z.string().trim().optional().default(""),
  }),
]);

const REPLACEABLE = new Set(["missing", "rejected", "expired", "pending"]);

export async function POST(request: Request) {
  const { user } = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the details and try again." },
      { status: 400 },
    );
  }
  const input = parsed.data;
  const admin = createAdminClient();
  const { data: cleaner } = await admin
    .from("cleaner_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (!cleaner?.onboarding_complete) {
    return NextResponse.json(
      { error: "Finish your application first." },
      { status: 409 },
    );
  }

  const statusColumn = documentStatusColumn(input.kind);
  const currentStatus = String(cleaner[statusColumn] ?? "missing");
  if (!REPLACEABLE.has(currentStatus)) {
    return NextResponse.json(
      { error: "This has already been approved." },
      { status: 409 },
    );
  }

  const updates: Record<string, unknown> = { [statusColumn]: "pending" };
  if (input.kind === "right_to_work") {
    const issue = rightToWorkIssue({
      date_of_birth: input.date_of_birth,
      right_to_work_expires_on: input.right_to_work_expires_on,
      right_to_work_route: input.right_to_work_route,
      right_to_work_share_code: input.right_to_work_share_code,
      right_to_work_visa_type: input.right_to_work_visa_type,
    });
    if (issue) return NextResponse.json({ error: issue }, { status: 400 });
    Object.assign(updates, {
      date_of_birth: input.date_of_birth,
      right_to_work_expires_on:
        input.right_to_work_route === "share_code" && input.right_to_work_expires_on
          ? input.right_to_work_expires_on
          : null,
      right_to_work_route: input.right_to_work_route,
      right_to_work_share_code:
        input.right_to_work_route === "share_code"
          ? normaliseShareCode(input.right_to_work_share_code)
          : null,
      right_to_work_visa_type:
        input.right_to_work_route === "share_code"
          ? input.right_to_work_visa_type || null
          : null,
      right_to_work_restriction: null,
    });
  } else {
    // Files must be in the cleaner's own folder of the private bucket.
    if (input.paths.some((path) => !path.startsWith(`${user.id}/`))) {
      return NextResponse.json({ error: "Upload the file again." }, { status: 400 });
    }
    if (input.kind === "id" || input.kind === "dbs") {
      updates[input.kind === "id" ? "id_document_url" : "dbs_document_url"] =
        input.paths.length === 1 ? input.paths[0] : JSON.stringify(input.paths);
      if (input.kind === "dbs") updates.dbs_path = "have";
    } else if (input.kind === "utr") {
      updates.utr_document_url = input.paths[0];
      updates.utr_path = "have";
    } else if (input.kind === "insurance") {
      if (input.expiry_date <= new Date().toISOString().slice(0, 10)) {
        return NextResponse.json(
          { error: "The insurance expiry date must be in the future." },
          { status: 400 },
        );
      }
      updates.insurance_certificate_url = input.paths[0];
      updates.insurance_expiry_date = input.expiry_date;
      updates.insurance_path = "have";
    }
  }

  // The "please re-upload" message is answered by this upload.
  const flags = { ...((cleaner.verification_flags as Record<string, unknown> | null) ?? {}) };
  if (flags.unreadable_doc_kind === input.kind || flags.unreadable_doc) {
    flags.unreadable_doc = false;
    flags.unreadable_doc_hint = null;
    flags.unreadable_doc_kind = null;
    flags.unreadable_doc_flagged_at = null;
    updates.verification_flags = flags;
  }

  const { error } = await admin.from("cleaner_profiles").update(updates).eq("id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const label = CLEANER_DOCUMENT_LABELS[input.kind];
  await alertAdmins(
    "cleaner_document_uploaded",
    `A cleaner sent a new ${label.toLowerCase()} to review`,
    `They replaced their ${label.toLowerCase()}. Open their profile to approve or reject it.`,
    {
      cleaner_id: user.id,
      cleanerUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/admin/cleaners/${user.id}`,
    },
  ).catch(() => undefined);

  return NextResponse.json({ success: true });
}
