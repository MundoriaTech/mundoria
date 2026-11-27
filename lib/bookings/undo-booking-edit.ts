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

type AddOnRow = { add_on_id: string; amount: number; label: string };

type EditRow = {
  add_ons_after: AddOnRow[] | null;
  add_ons_before: AddOnRow[] | null;
  after_values: Record<string, unknown>;
  before_values: Record<string, unknown>;
  booking_id: string;
  changes: BookingChange[];
  created_at: string;
  id: string;
  undo_of: string | null;
  undone_at: string | null;
};

type ReversePlan = { error: string } | { booking: EditableBooking; plan: BookingEditPlan };

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

const addOnKey = (rows: Array<{ add_on_id: string | null }> | null | undefined) =>
  (rows ?? [])
    .map((row) => String(row.add_on_id))
    .sort()
    .join(",");

/** Edits still in force: not undone, and not themselves an undo or reset. */
function activeEdits<T extends Pick<EditRow, "undo_of" | "undone_at">>(edits: T[]) {
  return edits.filter((edit) => !edit.undo_of && !edit.undone_at);
}

/**
 * The edit that "Undo" would reverse: the newest edit on the booking that
 * hasn't been undone and isn't itself an undo, with nothing newer still in
 * force after it.
 */
export function undoableEditId(edits: Array<Pick<EditRow, "id" | "undo_of" | "undone_at">>) {
  // Newest first.
  return activeEdits(edits)[0]?.id ?? null;
}

/**
 * Plans putting the booking back to how it was before `edits` (oldest first,
 * all still in force). Refuses if the booking has changed in some other way
 * since, so nothing made later is overwritten.
 */
async function planReverse(
  admin: Admin,
  bookingId: string,
  edits: EditRow[],
  options: { cleanerAgreed?: boolean },
): Promise<ReversePlan> {
  const [{ data: bookingData }, { data: currentAddOns }] = await Promise.all([
    admin.from("bookings").select(EDIT_BOOKING_SELECT).eq("id", bookingId).maybeSingle(),
    admin.from("booking_add_ons").select("add_on_id").eq("booking_id", bookingId),
  ]);
  const booking = bookingData as unknown as EditableBooking | null;
  if (!booking) return { error: "Booking not found." };

  // Per field: the value before the first edit, and after the last one.
  const original: Record<string, unknown> = {};
  const expected: Record<string, unknown> = {};
  let addOnsOriginal: AddOnRow[] | null = null;
  let addOnsExpected: AddOnRow[] | null = null;
  for (const edit of edits) {
    for (const [key, value] of Object.entries(edit.before_values ?? {})) {
      if (!(key in original)) original[key] = value;
    }
    Object.assign(expected, edit.after_values ?? {});
    if (edit.add_ons_before && addOnsOriginal === null) addOnsOriginal = edit.add_ons_before;
    if (edit.add_ons_after) addOnsExpected = edit.add_ons_after;
  }

  const keys = Object.keys(original);
  const notesOnly = keys.every((key) => NOTES_KEYS.includes(key)) && addOnsOriginal === null;
  const statusOk =
    (FULLY_EDITABLE_STATUSES as readonly string[]).includes(booking.status) ||
    (notesOnly && (NOTES_ONLY_STATUSES as readonly string[]).includes(booking.status));
  if (!statusOk) {
    return { error: "The visit has moved on (it's under way, finished or cancelled), so this can't be undone." };
  }

  // Something else changed these fields since: going back would overwrite it.
  const record = booking as unknown as Record<string, unknown>;
  const drifted =
    keys.some((key) => !same(record[key], expected[key])) ||
    (addOnsExpected !== null && addOnKey(currentAddOns) !== addOnKey(addOnsExpected));
  if (drifted) {
    return {
      error: "The booking has changed in another way since, so it can't simply be put back. Use Edit booking instead.",
    };
  }

  const updates: Record<string, unknown> = {};
  for (const key of keys) {
    if (!same(original[key], record[key])) updates[key] = original[key];
  }
  const addOnRows =
    addOnsOriginal !== null && addOnKey(addOnsOriginal) !== addOnKey(currentAddOns) ? addOnsOriginal : null;

  // Readable changes: each field from its latest value back to its first.
  const firstFrom = new Map<string, string>();
  const lastTo = new Map<string, string>();
  for (const edit of edits) {
    for (const change of edit.changes ?? []) {
      if (!firstFrom.has(change.field)) firstFrom.set(change.field, change.from);
      lastTo.set(change.field, change.to);
    }
  }
  const changes: BookingChange[] = Array.from(firstFrom.entries())
    .map(([field, from]) => ({ field, from: lastTo.get(field) ?? from, to: from }))
    .filter((change) => change.from !== change.to);

  const timeChanged = Object.keys(updates).some((key) => TIME_KEYS.includes(key));
  const addressChanged = "address_id" in updates;
  const oldTotalPence = Number(booking.amount_total ?? 0);
  const newTotalPence = "amount_total" in updates ? Number(updates.amount_total ?? oldTotalPence) : oldTotalPence;
  const oldCleanerPence = Number(booking.amount_cleaner ?? 0);
  const newCleanerPence =
    "amount_cleaner" in updates ? Number(updates.amount_cleaner ?? oldCleanerPence) : oldCleanerPence;

  return {
    booking,
    plan: {
      addOnRows,
      changes,
      cleanerMustReconfirm: Boolean(booking.cleaner_id) && (timeChanged || addressChanged) && !options.cleanerAgreed,
      newCleanerPence,
      newDiscountPence: Number(updates.discount_pence ?? booking.discount_pence ?? 0),
      newTotalPence,
      oldCleanerPence,
      oldTotalPence,
      priceChanged: newTotalPence !== oldTotalPence,
      timeChanged,
      updates,
    },
  };
}

async function loadEdits(admin: Admin, bookingId: string) {
  const { data } = await admin
    .from("booking_edits")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });
  return (data ?? []) as EditRow[];
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

  const history = await loadEdits(admin, edit.booking_id);
  if (undoableEditId([...history].reverse()) !== edit.id) {
    return { error: "Only the most recent edit can be undone. Undo the later ones first." };
  }
  const planned = await planReverse(admin, edit.booking_id, [edit], options);
  if ("error" in planned) return planned;
  return { ...planned, edit };
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

/** Reason prefix that marks a reset row in booking_edits. */
export const RESET_REASON_PREFIX = "Reset to original booking: ";

/**
 * Plans putting the booking back to what was originally booked, reversing
 * every edit still in force (by admins or the customer) in one go.
 */
export async function planReset(
  admin: Admin,
  bookingId: string,
  options: { cleanerAgreed?: boolean } = {},
): Promise<{ error: string } | { booking: EditableBooking; edits: EditRow[]; plan: BookingEditPlan }> {
  const edits = activeEdits(await loadEdits(admin, bookingId));
  if (!edits.length) return { error: "Nothing has been changed since this was booked." };
  const planned = await planReverse(admin, bookingId, edits, options);
  if ("error" in planned) return planned;
  if (!planned.plan.changes.length && !Object.keys(planned.plan.updates).length && !planned.plan.addOnRows) {
    return { error: "The booking already matches what was originally booked." };
  }
  return { ...planned, edits };
}

/** Resets the booking to the original, as one logged edit; marks every reversed edit undone. */
export async function resetBookingToOriginal(
  admin: Admin,
  input: { adminId: string; bookingId: string; cleanerAgreed?: boolean; reason: string },
) {
  const planned = await planReset(admin, input.bookingId, { cleanerAgreed: input.cleanerAgreed });
  if ("error" in planned) return { error: planned.error, status: 400 };
  const { booking, edits, plan } = planned;

  const saved = await applyBookingEdit({
    actor: "admin",
    actorId: input.adminId,
    admin,
    adminTitle: "A booking was reset to what was originally booked",
    booking,
    plan,
    reason: `${RESET_REASON_PREFIX}${input.reason}`,
    // Marks the row as a reversal, so it isn't offered for undo itself.
    undoOf: edits[edits.length - 1].id,
  });
  if ("error" in saved) return saved;

  await admin
    .from("booking_edits")
    .update({ undone_at: new Date().toISOString(), undone_by: input.adminId })
    .in(
      "id",
      edits.map((edit) => edit.id),
    );
  return { bookingId: booking.id, changes: plan.changes, holdReplaced: holdNeedsReplacing(booking, plan) };
}
