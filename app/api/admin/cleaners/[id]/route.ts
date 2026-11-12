import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { logAdminAction, requireAdmin } from "@/lib/admin/auth";
import {
  CLEANER_DOCUMENT_LABELS,
  documentStatusColumn,
  documentVerifiedColumn,
  isCleanerDocumentKind,
  writeDocumentReview,
} from "@/lib/cleaner/document-reviews";
import {
  mergeVerificationFlags,
  reasonSuggestsUnreadableDoc,
} from "@/lib/cleaner/onboarding-compliance";
import { parseDocumentUrls } from "@/lib/cleaner/document-urls";
import { sendBrandedEmail } from "@/lib/email/send-email";
import {
  createInAppNotification,
  sendOneSignalNotification,
} from "@/lib/notifications/send";

const schema = z.object({
  action: z.enum([
    "approve",
    "reject",
    "suspend",
    "remove",
    "set_tier",
    "complete_interview",
    "fail_interview",
    "approve_skills",
    "request_info",
    "review_document",
  ]),
  document_kind: z
    .enum(["dbs", "id", "utr", "insurance", "headshot"])
    .optional(),
  document_decision: z.enum(["verified", "rejected"]).optional(),
  flag_unreadable_doc: z.boolean().optional().default(false),
  reason: z.string().trim().optional().default(""),
  tier: z.enum(["bronze", "silver", "gold", "rose_gold", "elite"]).optional(),
});

const NOTE_REQUIRED_ACTIONS = new Set([
  "reject",
  "request_info",
  "fail_interview",
  "suspend",
  "remove",
  "review_document",
]);

const DEFAULT_ACTION_NOTES: Record<string, string> = {
  approve: "Approved for live jobs after onboarding call and document checks.",
  approve_skills: "Specialist skills approved.",
  complete_interview: "Onboarding call marked complete.",
  set_tier: "Tier updated by admin.",
};

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
          parsed.error.issues[0]?.message ?? "Invalid cleaner action request.",
      },
      { status: 400 },
    );
  }
  const {
    action,
    document_decision,
    document_kind,
    flag_unreadable_doc,
    tier,
  } = parsed.data;
  let reason = parsed.data.reason.trim();
  if (NOTE_REQUIRED_ACTIONS.has(action) && reason.length < 3) {
    return NextResponse.json(
      {
        error:
          "Add a short note (at least 3 characters) explaining this decision.",
      },
      { status: 400 },
    );
  }
  if (!reason) {
    reason = DEFAULT_ACTION_NOTES[action] ?? `Admin action: ${action}`;
  }

  const { data: current } = await auth.admin
    .from("cleaner_profiles")
    .select(
      "tier,performance_score,total_jobs,interview_status,skills_exam_passed,headshot_url,headshot_status,utr_number,utr_document_url,utr_document_status,dbs_document_url,dbs_document_status,id_document_url,id_document_status,insurance_certificate_url,insurance_status,verification_flags",
    )
    .eq("id", params.id)
    .single();

  if (action === "review_document") {
    if (!document_kind || !isCleanerDocumentKind(document_kind)) {
      return NextResponse.json(
        { error: "Choose which document you are reviewing." },
        { status: 400 },
      );
    }
    if (!document_decision) {
      return NextResponse.json(
        { error: "Choose approve or reject for this document." },
        { status: 400 },
      );
    }
  }

  if (action === "approve") {
    if (current?.interview_status !== "completed") {
      return NextResponse.json(
        {
          error:
            "Mark the onboarding call as completed before approving for live jobs.",
        },
        { status: 400 },
      );
    }
    if (!current?.skills_exam_passed) {
      return NextResponse.json(
        { error: "Cleaner has not passed the skills exam." },
        { status: 400 },
      );
    }
    if (!current?.headshot_url) {
      return NextResponse.json(
        { error: "Cleaner has not uploaded a headshot." },
        { status: 400 },
      );
    }
    if (!current?.utr_number) {
      return NextResponse.json(
        { error: "Cleaner has not provided a UTR number." },
        { status: 400 },
      );
    }

    const pendingDocs: string[] = [];
    const requireVerified = (
      label: string,
      status: string | null | undefined,
      hasFile: boolean,
    ) => {
      if (!hasFile) return;
      if (status !== "verified") pendingDocs.push(label);
    };
    requireVerified(
      "Headshot",
      current?.headshot_status,
      Boolean(current?.headshot_url),
    );
    requireVerified(
      "Government ID",
      current?.id_document_status,
      parseDocumentUrls(current?.id_document_url).some(Boolean),
    );
    requireVerified(
      "DBS",
      current?.dbs_document_status,
      parseDocumentUrls(current?.dbs_document_url).some(Boolean),
    );
    requireVerified(
      "UTR proof",
      current?.utr_document_status,
      Boolean(current?.utr_document_url),
    );
    requireVerified(
      "Insurance",
      current?.insurance_status,
      Boolean(current?.insurance_certificate_url),
    );
    if (pendingDocs.length > 0) {
      return NextResponse.json(
        {
          error: `Approve or reject each uploaded document first: ${pendingDocs.join(", ")}.`,
        },
        { status: 400 },
      );
    }
  }

  const status =
    action === "approve"
      ? "certified"
      : action === "reject" || action === "fail_interview"
        ? "in_training"
        : action === "suspend"
          ? "suspended"
          : action === "remove"
            ? "removed"
            : undefined;
  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;

  if (action === "complete_interview") {
    updates.interview_status = "completed";
    updates.interview_notes = reason;
    updates.interview_completed_at = new Date().toISOString();
    updates.interview_completed_by = auth.user.id;
  }

  if (action === "fail_interview") {
    updates.interview_status = "failed";
    updates.interview_notes = reason;
    updates.interview_completed_at = new Date().toISOString();
    updates.interview_completed_by = auth.user.id;
    updates.certification_passed = false;
    updates.certification_notes = reason;
    updates.certification_assessed_by = auth.user.id;
    updates.certification_assessed_at = new Date().toISOString();
  }

  if (action === "review_document" && document_kind && document_decision) {
    const statusColumn = documentStatusColumn(document_kind);
    const verifiedColumn = documentVerifiedColumn(document_kind);
    updates[statusColumn] = document_decision;
    if (verifiedColumn) {
      updates[verifiedColumn] = document_decision === "verified";
    }
    updates.verification_flags = writeDocumentReview(
      (current?.verification_flags as Record<string, unknown> | null) ?? {},
      document_kind,
      {
        decision: document_decision,
        note: reason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: auth.user.id,
      },
    );
    if (document_decision === "rejected") {
      updates.status = "in_training";
    }
  }

  if (action === "approve") {
    // Documents must already be individually verified above.
    updates.certification_passed = true;
    updates.certification_notes = reason;
    updates.certification_assessed_by = auth.user.id;
    updates.certification_assessed_at = new Date().toISOString();
    updates.tier = "silver";
  }
  if (action === "reject" || action === "request_info") {
    if (action === "reject") {
      updates.certification_passed = false;
      updates.certification_notes = reason;
      updates.certification_assessed_by = auth.user.id;
      updates.certification_assessed_at = new Date().toISOString();
    }
    if (
      flag_unreadable_doc ||
      reasonSuggestsUnreadableDoc(reason)
    ) {
      updates.verification_flags = mergeVerificationFlags(
        (current?.verification_flags as Record<string, unknown> | null) ?? {},
        {
          unreadable_doc: true,
          unreadable_doc_hint: reason,
          unreadable_doc_flagged_at: new Date().toISOString(),
        },
      );
    }
  }
  if (action === "approve_skills") {
    updates.skills_assessment_status = "approved";
    updates.specialist_review_required = false;
  }
  if (action === "set_tier") {
    if (!tier) return NextResponse.json({ error: "Tier required" }, { status: 400 });
    updates.tier = tier;
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
  if (Object.keys(updates).length > 0) {
    const { error } = await auth.admin
      .from("cleaner_profiles")
      .update(updates)
      .eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

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
    metadata: {
      ...(tier ? { tier } : {}),
      ...(document_kind ? { document_kind } : {}),
      ...(document_decision ? { document_decision } : {}),
    },
    reason,
  });

  const documentLabel =
    document_kind && isCleanerDocumentKind(document_kind)
      ? CLEANER_DOCUMENT_LABELS[document_kind]
      : "Document";

  const notificationBody =
    action === "approve"
      ? "You are approved and can now receive cleaning jobs."
      : action === "reject"
        ? "Your application is on hold. Mundoria will follow up if more is needed."
        : action === "request_info"
          ? "We need a little more information to finish reviewing your application. Check your email for details."
          : action === "review_document" && document_decision === "verified"
            ? `Your ${documentLabel} document was accepted.`
            : action === "review_document" && document_decision === "rejected"
              ? `Your ${documentLabel} document needs another look. ${reason}`
          : action === "approve_skills"
            ? "Your specialist skills have been reviewed and approved."
        : action === "complete_interview"
          ? "Your onboarding call is complete. Mundoria will finish document review shortly."
          : action === "fail_interview"
            ? "Your onboarding call didn’t lead to approval this time. Mundoria will follow up with next steps."
            : action === "suspend"
              ? "Your cleaner account has been temporarily suspended."
              : action === "remove"
                ? "Your cleaner account has been removed from Mundoria."
                : `Your cleaner account was updated: ${action}.`;

  const notificationTitle =
    action === "approve"
      ? "You're approved"
      : action === "reject"
        ? "Application on hold"
        : action === "request_info"
          ? "More information needed"
          : action === "review_document" && document_decision === "verified"
            ? `${documentLabel} accepted`
            : action === "review_document" && document_decision === "rejected"
              ? `${documentLabel} needs another look`
          : action === "approve_skills"
            ? "Specialist skills approved"
        : action === "complete_interview"
          ? "Onboarding call complete"
          : action === "fail_interview"
            ? "Onboarding call update"
            : "Account update";

  await createInAppNotification(
    params.id,
    `cleaner_${action}`,
    notificationTitle,
    notificationBody,
    { action, reason },
  );

  try {
    const { data: recipient } = await auth.admin
      .from("profiles")
      .select("email,full_name,onesignal_player_id,notification_preferences")
      .eq("id", params.id)
      .maybeSingle();
    const preferences = recipient?.notification_preferences as
      | { push?: boolean }
      | undefined;
    if (preferences?.push !== false) {
      await sendOneSignalNotification({
        body: notificationBody,
        data: { action },
        playerId: (recipient?.onesignal_player_id as string | null) ?? null,
        title: notificationTitle,
      });
    }

    if (
      (action === "approve" ||
        action === "reject" ||
        action === "request_info" ||
        (action === "review_document" && document_decision === "rejected")) &&
      recipient?.email
    ) {
      const fullName = (recipient.full_name as string | null) ?? "";
      await sendBrandedEmail({
        data: {
          appUrl:
            process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin,
          firstName: fullName.split(" ")[0] || undefined,
          fullName: fullName || undefined,
          reason:
            action === "review_document"
              ? `${documentLabel}: ${reason}`
              : reason,
          tier: action === "approve" ? "Silver" : undefined,
        },
        template:
          action === "approve"
            ? "cleaner.application_approved"
            : action === "reject"
              ? "cleaner.application_rejected"
              : "cleaner.application_needs_info",
        to: recipient.email as string,
      });
    }
  } catch (notifyError) {
    Sentry.captureException(notifyError);
  }

  revalidatePath(`/admin/cleaners/${params.id}`);
  revalidatePath(`/admin/cleaner/${params.id}`);
  revalidatePath("/admin/cleaners");
  revalidatePath("/admin/dashboard");
  revalidatePath("/cleaner/profile");
  revalidatePath("/cleaner/dashboard");

  return NextResponse.json({ success: true });
}
