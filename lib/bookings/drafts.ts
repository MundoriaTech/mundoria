import { createAdminClient } from "@/lib/supabase/admin";
import { sendBrandedEmail } from "@/lib/email/send-email";
import type { BookingDraft } from "@/types/customer";
import { randomBytes } from "crypto";

const FIRST_REMINDER_AFTER_MS = 45 * 60 * 1000;
const SECOND_REMINDER_AFTER_MS = 24 * 60 * 60 * 1000;
const DRAFT_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_REMINDERS = 2;

export function normalizeBookingLeadEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidBookingLeadEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeBookingLeadEmail(email));
}

export function newBookingDraftResumeToken() {
  return randomBytes(24).toString("hex");
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function bookingDraftResumeUrl(token: string) {
  return `${appUrl()}/booking/new?draft=${encodeURIComponent(token)}`;
}

export type BookingDraftRow = {
  id: string;
  resume_token: string;
  email: string;
  user_id: string | null;
  draft: BookingDraft | Record<string, unknown>;
  current_step: string | null;
  completed_at: string | null;
  completed_booking_id: string | null;
  reminder_count: number;
  last_reminded_at: string | null;
  updated_at: string;
  created_at: string;
};

export async function upsertBookingDraftLead(input: {
  currentStep?: string | null;
  draft: Partial<BookingDraft>;
  email: string;
  marketingOptIn?: boolean;
  resumeToken?: string | null;
  userId?: string | null;
}) {
  const email = normalizeBookingLeadEmail(input.email);
  if (!isValidBookingLeadEmail(email)) {
    throw new Error("Enter a valid email address.");
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  let resumeToken = input.resumeToken?.trim() || null;

  if (resumeToken) {
    const { data: existing } = await admin
      .from("booking_drafts")
      .select("id,completed_at,resume_token")
      .eq("resume_token", resumeToken)
      .maybeSingle();
    if (existing && !existing.completed_at) {
      const { data, error } = await admin
        .from("booking_drafts")
        .update({
          current_step: input.currentStep ?? null,
          draft: input.draft,
          email,
          marketing_opt_in: Boolean(input.marketingOptIn),
          updated_at: now,
          ...(input.userId ? { user_id: input.userId } : {}),
        })
        .eq("id", existing.id)
        .select("id,resume_token")
        .single();
      if (error) throw new Error(error.message);
      return data;
    }
  }

  resumeToken = newBookingDraftResumeToken();
  const { data, error } = await admin
    .from("booking_drafts")
    .insert({
      current_step: input.currentStep ?? null,
      draft: input.draft,
      email,
      marketing_opt_in: Boolean(input.marketingOptIn),
      resume_token: resumeToken,
      updated_at: now,
      user_id: input.userId ?? null,
    })
    .select("id,resume_token")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getBookingDraftByToken(token: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("booking_drafts")
    .select(
      "id,resume_token,email,user_id,draft,current_step,completed_at,completed_booking_id,reminder_count,last_reminded_at,updated_at,created_at",
    )
    .eq("resume_token", token)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as BookingDraftRow | null;
}

export async function claimBookingDraftForUser(
  token: string,
  userId: string,
) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("booking_drafts")
    .update({
      updated_at: new Date().toISOString(),
      user_id: userId,
    })
    .eq("resume_token", token)
    .is("completed_at", null)
    .select("id,resume_token,email")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function completeBookingDraft(input: {
  bookingId: string;
  resumeToken?: string | null;
  userId?: string | null;
}) {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  if (input.resumeToken) {
    await admin
      .from("booking_drafts")
      .update({
        completed_at: now,
        completed_booking_id: input.bookingId,
        updated_at: now,
      })
      .eq("resume_token", input.resumeToken)
      .is("completed_at", null);
  }
  if (input.userId) {
    await admin
      .from("booking_drafts")
      .update({
        completed_at: now,
        completed_booking_id: input.bookingId,
        updated_at: now,
      })
      .eq("user_id", input.userId)
      .is("completed_at", null);
  }
}

export async function processAbandonedBookingReminders(limit = 40) {
  const admin = createAdminClient();
  const now = Date.now();
  const cutoff = new Date(now - DRAFT_TTL_MS).toISOString();
  const firstDue = new Date(now - FIRST_REMINDER_AFTER_MS).toISOString();
  const secondDue = new Date(now - SECOND_REMINDER_AFTER_MS).toISOString();

  // Expire very old open drafts (no email).
  await admin
    .from("booking_drafts")
    .update({
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .is("completed_at", null)
    .lt("updated_at", cutoff);

  const { data: candidates } = await admin
    .from("booking_drafts")
    .select(
      "id,resume_token,email,draft,reminder_count,last_reminded_at,updated_at",
    )
    .is("completed_at", null)
    .lt("reminder_count", MAX_REMINDERS)
    .order("updated_at", { ascending: true })
    .limit(limit * 3);

  let sent = 0;
  let scanned = 0;

  for (const row of candidates ?? []) {
    scanned += 1;
    const reminderCount = Number(row.reminder_count ?? 0);
    const updatedAt = new Date(row.updated_at).getTime();
    const lastReminded = row.last_reminded_at
      ? new Date(row.last_reminded_at).getTime()
      : 0;

    const dueFirst =
      reminderCount === 0 && updatedAt <= now - FIRST_REMINDER_AFTER_MS;
    const dueSecond =
      reminderCount === 1 &&
      lastReminded > 0 &&
      lastReminded <= now - SECOND_REMINDER_AFTER_MS;

    if (!dueFirst && !dueSecond) continue;
    // Guard: never remind if they were just updated after firstDue window math
    if (reminderCount === 0 && row.updated_at > firstDue) continue;
    if (reminderCount === 1 && (row.last_reminded_at ?? "") > secondDue) {
      continue;
    }

    const draft = (row.draft ?? {}) as Partial<BookingDraft>;
    const resumeUrl = bookingDraftResumeUrl(row.resume_token);
    const ok = await sendBrandedEmail({
      data: {
        appUrl: appUrl(),
        bookingUrl: resumeUrl,
        resumeUrl,
        scheduledDate: draft.scheduledDate,
        scheduledTime: draft.scheduledTime
          ? String(draft.scheduledTime).slice(0, 5)
          : undefined,
        serviceName: draft.serviceType
          ? String(draft.serviceType).replaceAll("_", " ")
          : undefined,
      },
      template: "customer.booking_incomplete",
      to: row.email,
    });

    if (!ok) continue;

    await admin
      .from("booking_drafts")
      .update({
        last_reminded_at: new Date().toISOString(),
        reminder_count: reminderCount + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    sent += 1;
    if (sent >= limit) break;
  }

  return { scanned, sent };
}
