import {
  EDIT_BOOKING_SELECT,
  FULLY_EDITABLE_STATUSES,
  NOTES_ONLY_STATUSES,
  type BookingChange,
  type BookingEditPlan,
  type EditableBooking,
} from "@/lib/admin/booking-edit";
import { applyBookingEdit, holdNeedsReplacing } from "@/lib/bookings/apply-booking-edit";
import type { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

type EditRow = {
  add_ons_before: Array<{ add_on_id: string; amount: number; label: string }> | null;
  after_values: Record<string, unknown>;
  before_values: Record<string, unknown>;
  booking_id: string;
  changes: BookingChange[];
  created_at: string;
  id: string;
  undo_of: string | null;
  undone_at: string | null;
};

const TIME_KEYS = ["scheduled_date", "scheduled_start_time"];
const NOTES_KEYS = ["special_instructions", "access_instructions"];

/** Compare stored values loosely: "10:00" and "10:00:00", 3 and "3.00". */
function same(a: unknown, b: unknown) {
  const norm = (value: unknown) => {
    if (value == null || value === "") return "";
    const text = String(value);
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(text)) return text.slice(0, 5);
    const num = Number(text);
    return Number.isFinite(num) && text.trim() !== "" ? String(num) : text.trim();
  };
  return norm(a) === norm(b);
}

/**
 * The edit that "Undo" would reverse: the newest edit on the booking that
 * hasn't been undone and isn't itself an undo, with nothing newer still in
 * force after it.
 */
export function undoableEditId(edits: Array<Pick<EditRow, "id" | "undo_of" | "undone_at">>) {
  // Newest first.
  for (const edit of edits) {
    if (edit.undo_of) continue; // an undo; look further back
    if (edit.undone_at) continue; // already reversed
    return edit.id;
  }
  return null;
}

/** Plans the reverse of a saved edit, or explains why it can't be undone. */
export async function planUndo(
  admin: Admin,
  editId: string,
  options: { cleanerAgreed?: boolean } = {},
): Promise<{ error: string } | { booking: EditableBooking; edit: EditRow; plan: BookingEditPlan }> {
  const { data: editData } = await admin.from("booking_edits").select("*").eq("id", editId).maybeSingle();
  const edit = editData as EditRow | null;
  if (!edit) return { error: "That edit wasn't found." };
  if (edit.undo_of) return { error: "An undo can't itself be undone. Edit the booking instead." };
  if (edit.undone_at) return { error: "This edit has already been undone." };

  const { data: history } = await admin
    .from("booking_edits")
    .select("id,undo_of,undone_at")
    .eq("booking_id", edit.booking_id)
    .order("created_at", { ascending: false });
  if (undoableEditId(history ?? []) !== edit.id) {
    return { error: "Only the most recent edit can be undone. Undo the later ones first." };
  }

  const { data: bookingData } = await admin
    .from("bookings")
    .select(EDIT_BOOKING_SELECT)
    .eq("id", edit.booking_id)
    .maybeSingle();
  const booking = bookingData as unknown as EditableBooking | null;
  if (!booking) return { error: "Booking not found." };

  const keys = Object.keys(edit.before_values ?? {});
  const notesOnly = keys.every((key) => NOTES_KEYS.includes(key));
  const statusOk =
    (FULLY_EDITABLE_STATUSES as readonly string[]).includes(booking.status) ||
    (notesOnly && (NOTES_ONLY_STATUSES as readonly string[]).includes(booking.status));
  if (!statusOk) {
    return { error: "The visit has moved on (it's under way, finished or cancelled), so this edit can't be undone." };
  }

  // Something else changed these fields since: undoing would overwrite it.
  const record = booking as unknown as Record<string, unknown>;
  const drifted = keys.filter((key) => !same(record[key], edit.after_values?.[key]));
  if (drifted.length) {
    return {
      error: "The booking has changed since this edit, so it can't simply be undone. Use Edit booking instead.",
    };
  }

  const updates: Record<string, unknown> = { ...edit.before_values };
  const timeChanged = keys.some((key) => TIME_KEYS.includes(key));
  const addressChanged = keys.includes("address_id");
  const oldTotalPence = Number(booking.amount_total ?? 0);
  const newTotalPence =
    "amount_total" in updates ? Number(updates.amount_total ?? oldTotalPence) : oldTotalPence;
  const oldCleanerPence = Number(booking.amount_cleaner ?? 0);
  const newCleanerPence =
    "amount_cleaner" in updates ? Number(updates.amount_cleaner ?? oldCleanerPence) : oldCleanerPence;

  const plan: BookingEditPlan = {
    addOnRows: edit.add_ons_before,
    changes: (edit.changes ?? []).map((change) => ({ field: change.field, from: change.to, to: change.from })),
    cleanerMustReconfirm:
      Boolean(booking.cleaner_id) && (timeChanged || addressChanged) && !options.cleanerAgreed,
    newCleanerPence,
    newDiscountPence: Number(updates.discount_pence ?? booking.discount_pence ?? 0),
    newTotalPence,
    oldCleanerPence,
    oldTotalPence,
    priceChanged: newTotalPence !== oldTotalPence,
    timeChanged,
    updates,
  };
  return { booking, edit, plan };
}

/** Reverses a saved edit as a new, logged edit, and marks the original undone. */
export async function undoBookingEdit(
  admin: Admin,
  input: { adminId: string; cleanerAgreed?: boolean; editId: string; reason: string },
) {
  const planned = await planUndo(admin, input.editId, { cleanerAgreed: input.cleanerAgreed });
  if ("error" in planned) return { error: planned.error, status: 400 };
  const { booking, edit, plan } = planned;

  const saved = await applyBookingEdit({
    actor: "admin",
    actorId: input.adminId,
    admin,
    booking,
    plan,
    reason: `Undo: ${input.reason}`,
    undoOf: edit.id,
  });
  if ("error" in saved) return saved;

  await admin
    .from("booking_edits")
    .update({ undone_at: new Date().toISOString(), undone_by: input.adminId })
    .eq("id", edit.id);
  return { bookingId: booking.id, changes: plan.changes, holdReplaced: holdNeedsReplacing(booking, plan) };
}
