"use client";

import {
  Hourglass,
  MessageCircle,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { BookingSummaryCard } from "@/components/customer/booking-basket";
import { CleanerMap } from "@/components/customer/cleaner-map";
import { CompletionChecklistConfirmation } from "@/components/customer/completion-checklist-confirmation";
import { FollowOnPayModal } from "@/components/customer/follow-on-pay-modal";
import { RatingForm } from "@/components/customer/rating-form";
import { RescheduleModal } from "@/components/customer/reschedule-modal";
import { BookingStatusBadge } from "@/components/shared/booking-status-badge";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { useFeedback } from "@/components/shared/feedback-provider";
import { GuidedDisputeForm } from "@/components/shared/guided-dispute-form";
import { Button } from "@/components/ui/button";
import {
  formatConfirmByDeadline,
  isCleanerVisibleToCustomer,
  isWaitingForCleanerAcceptance,
} from "@/lib/customer/booking-visibility";
import {
  formatMoney,
  formatServiceName,
  standardLabel,
} from "@/lib/customer/services";
import {
  PAYMENT_HELP_HREF,
  paymentStatusDescription,
  paymentStatusLabel,
} from "@/lib/customer/payment-status";
import {
  canCustomerChangeSchedule,
  canCustomerReschedule,
  scheduleChangeFeePreview,
} from "@/lib/bookings/schedule";
import { cleanerTierLabel } from "@/lib/cleaner/tier";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Booking, BookingChecklistItem } from "@/types/customer";

export function BookingDetail({
  checklistItems,
  customerId,
  hasCompletionConfirmation,
  hasRating,
  initialBooking,
  offerExpiresAt = null,
}: {
  checklistItems: BookingChecklistItem[];
  customerId: string;
  hasCompletionConfirmation: boolean;
  hasRating: boolean;
  initialBooking: Booking;
  offerExpiresAt?: string | null;
}) {
  const router = useRouter();
  const { success } = useFeedback();
  const [booking, setBooking] = useState(initialBooking);
  const [showCancel, setShowCancel] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showRating, setShowRating] = useState(
    booking.status === "completed" && !hasRating,
  );
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const canCancel = useMemo(
    () =>
      canCustomerChangeSchedule({
        scheduledDate: booking.scheduled_date,
        scheduledStartTime: booking.scheduled_start_time,
        status: booking.status,
      }),
    [booking],
  );
  const canReschedule = useMemo(
    () =>
      canCustomerReschedule({
        scheduledDate: booking.scheduled_date,
        scheduledStartTime: booking.scheduled_start_time,
        status: booking.status,
      }),
    [booking],
  );
  const feePreview = useMemo(
    () =>
      scheduleChangeFeePreview({
        amountTotal: Number(booking.amount_total ?? 0),
        scheduledDate: booking.scheduled_date,
        scheduledStartTime: booking.scheduled_start_time,
      }),
    [booking],
  );
  const needsPayment =
    booking.payment_status === "unpaid" && booking.status !== "cancelled";

  const waitingForCleaner = isWaitingForCleanerAcceptance(booking.status);
  const cleanerVisible = isCleanerVisibleToCustomer(booking.status);

  useEffect(() => {
    setBooking(initialBooking);
  }, [initialBooking]);

  useEffect(() => {
    if (cleanerVisible && booking.cleaner_id && !booking.cleaner) {
      router.refresh();
    }
  }, [booking.cleaner, booking.cleaner_id, cleanerVisible, router]);

  useEffect(() => {
    const supabase = createBrowserClient();
    const channel = supabase
      .channel(`booking-${booking.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          filter: `id=eq.${booking.id}`,
          schema: "public",
          table: "bookings",
        },
        (payload) => {
          const next = payload.new as Booking;
          setBooking((current) => ({
            ...current,
            ...next,
            cleaner: isCleanerVisibleToCustomer(next.status)
              ? current.cleaner
              : null,
          }));
          if (
            isCleanerVisibleToCustomer(next.status) &&
            !isCleanerVisibleToCustomer(booking.status)
          ) {
            router.refresh();
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          filter: `booking_id=eq.${booking.id}`,
          schema: "public",
          table: "cleaner_locations",
        },
        (payload) => {
          const location = payload.new as {
            latitude?: number;
            longitude?: number;
          };
          const latitude = location.latitude;
          const longitude = location.longitude;
          if (latitude !== undefined && longitude !== undefined) {
            setBooking((current) => ({
              ...current,
              cleaner_live_latitude: latitude,
              cleaner_live_longitude: longitude,
            }));
          }
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [booking.id, booking.status, router]);

  async function cancelBooking() {
    setError(null);
    const response = await fetch(`/api/bookings/${booking.id}/cancel`, {
      body: JSON.stringify({ reason }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error ?? "Unable to cancel booking.");
      return;
    }

    setBooking((current) => ({ ...current, status: "cancelled" }));
    setShowCancel(false);
    success({
      kind: "done",
      title: "Booking cancelled",
      note: "Any eligible refund will be returned to your original payment method.",
    });
    router.refresh();
  }

  const confirmByLabel = offerExpiresAt
    ? formatConfirmByDeadline(offerExpiresAt)
    : null;
  const destination =
    booking.address?.latitude !== null &&
    booking.address?.latitude !== undefined &&
    booking.address.longitude !== null &&
    booking.address.longitude !== undefined
      ? {
          lat: Number(booking.address.latitude),
          lng: Number(booking.address.longitude),
        }
      : null;

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-primary">Booking</p>
          <h1 className="mt-1 break-words text-2xl font-semibold tracking-tight sm:text-3xl">
            {formatServiceName(booking.service_type)}
          </h1>
          <p className="mt-2 font-mono text-xs text-muted-foreground sm:text-sm">
            #{booking.id.slice(0, 8)}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          {needsPayment ? (
            <Button
              className="min-h-11 w-full sm:w-auto"
              onClick={() => setShowPay(true)}
            >
              Authorise payment
            </Button>
          ) : null}
          {canReschedule ? (
            <Button
              className="min-h-11 w-full sm:w-auto"
              onClick={() => setShowReschedule(true)}
              variant="outline"
            >
              Change date &amp; time
            </Button>
          ) : null}
          <Button
            className="min-h-11 w-full sm:w-auto"
            onClick={() => setShowDispute(true)}
            variant="outline"
          >
            Report issue
          </Button>
          {cleanerVisible && booking.cleaner_id ? (
            <Button asChild className="min-h-11 w-full sm:w-auto" variant="outline">
              <Link href={`/messages/${booking.id}`}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Message
              </Link>
            </Button>
          ) : null}
          {canCancel ? (
            <Button
              className="min-h-11 w-full sm:w-auto"
              onClick={() => setShowCancel(true)}
              variant="destructive"
            >
              Cancel booking
            </Button>
          ) : null}
        </div>
      </div>

      {booking.status === "cancelled" ? (
        <div className="rounded-xl bg-muted p-4 text-sm text-foreground">
          This booking was cancelled.
          {booking.payment_status === "refunded"
            ? " Any payment taken has been refunded."
            : booking.payment_status === "held"
              ? " The card hold has been released where applicable."
              : ""}
        </div>
      ) : waitingForCleaner ? (
        <LookingForCleanerCard confirmByLabel={confirmByLabel} />
      ) : (
        <div className="flex items-center gap-3">
          <BookingStatusBadge status={booking.status} />
        </div>
      )}

      {booking.status !== "cancelled" ? (
        <div
          className={cn(
            "rounded-xl border p-4 text-sm",
            booking.payment_status === "released"
              ? "border-emerald-200 bg-emerald-50 text-emerald-950"
              : booking.payment_status === "held"
                ? "border-[#d9ccef] bg-[#efe6ff] text-[#3b3358]"
                : booking.payment_status === "refunded"
                  ? "border-border bg-muted text-foreground"
                  : "border-amber-200 bg-amber-50 text-amber-950",
          )}
        >
          <p className="font-semibold">
            {paymentStatusLabel(booking.payment_status)}
          </p>
          <p className="mt-1 leading-6">
            {paymentStatusDescription(booking.payment_status)}{" "}
            <Link
              className="font-semibold underline-offset-2 hover:underline"
              href={PAYMENT_HELP_HREF}
            >
              How payment works
            </Link>
          </p>
          {needsPayment ? (
            <Button
              className="mt-3 min-h-11"
              onClick={() => setShowPay(true)}
              size="sm"
            >
              Authorise {formatMoney(booking.amount_total ?? 0)}
            </Button>
          ) : null}
        </div>
      ) : null}

      {booking.booking_protected &&
      cleanerVisible &&
      ["confirmed", "cleaner_en_route"].includes(booking.status) ? (
        <Notice
          body="Backup professionals are ready if anything changes. You won’t see operational detail — just a protected booking."
          title="Your booking is protected"
        />
      ) : null}
      {cleanerVisible && booking.previous_cleaner_id && booking.cleaner ? (
        <Notice
          body={`${booking.cleaner.full_name.split(" ")[0]} is now assigned to your clean.`}
          title="Your cleaning professional has changed"
        />
      ) : null}

      {booking.checkin_verified ? (
        <Notice
          body="Your cleaner has arrived and checked in."
          title="Cleaning has started"
        />
      ) : null}
      {booking.checkout_verified ? (
        <Notice
          body="Your cleaner has checked out. Please review the completed job."
          title="Cleaning complete"
        />
      ) : null}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-4">
          <BookingSummaryCard
            addOns={(booking.add_ons ?? []).map((addOn) => ({
              amount: addOn.amount,
              label: addOn.label,
            }))}
            address={booking.address ?? null}
            amount={
              booking.amount_total != null ? Number(booking.amount_total) : null
            }
            bathrooms={booking.address?.num_bathrooms ?? null}
            bedrooms={booking.address?.num_bedrooms ?? null}
            durationHours={booking.estimated_duration_hours}
            frequencyLabel={frequencyLabelForBooking(booking)}
            hasPets={petsFromNotes(booking.special_instructions)}
            priorityAreas={booking.special_attention_areas ?? []}
            scheduledDate={booking.scheduled_date}
            scheduledTime={booking.scheduled_start_time}
            serviceLabel={formatServiceName(booking.service_type)}
            standardLabel={standardLabel(booking.cleaning_standard ?? "enhanced")}
            title="Booking details"
          />

          <div className="rounded-[1.25rem] bg-[#f3f3f5] px-5 py-4 text-sm text-[#5a5470]">
            <div className="flex items-center justify-between gap-3 text-[#1c133b]">
              <span className="font-semibold">Payment</span>
              <span className="font-semibold">
                {paymentStatusLabel(booking.payment_status)}
              </span>
            </div>
            {["completed", "awaiting_customer_confirmation"].includes(
              booking.status,
            ) || booking.payment_status === "released" ? (
              <div className="mt-3">
                <Button asChild className="w-full sm:w-auto" size="sm" variant="outline">
                  <Link href={`/booking/${booking.id}/receipt`}>
                    View receipt / invoice
                  </Link>
                </Button>
              </div>
            ) : booking.payment_status === "held" ? (
              <p className="mt-2 text-xs text-[#8b8798]">
                Your receipt becomes available after the clean when payment is
                captured.
              </p>
            ) : null}
          </div>
        </div>

        <section className="overflow-hidden rounded-[1.25rem] bg-[#f3f3f5] p-4 sm:p-5">
          <h2 className="text-base font-bold text-[#1c133b]">Your cleaner</h2>
          {cleanerVisible && booking.cleaner ? (
            <div className="mt-5 flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-lg font-bold text-[#6a45b8]">
                {booking.cleaner.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={booking.cleaner.full_name}
                    className="h-full w-full object-cover"
                    src={booking.cleaner.avatar_url}
                  />
                ) : (
                  booking.cleaner.full_name.charAt(0)
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-[#1c133b]">
                  {booking.cleaner.full_name}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full bg-[#efe6ff] px-2 py-0.5 text-xs font-semibold capitalize text-[#6a45b8]">
                    {cleanerTierLabel(booking.cleaner.tier)}
                  </span>
                  <span className="text-xs text-[#8b8798]">
                    Mundoria medallion
                  </span>
                </div>
              </div>
            </div>
          ) : waitingForCleaner ? (
            <p className="mt-4 text-sm text-[#5a5470]">
              We’re looking for your cleaner. You’ll see their details once your
              session is confirmed.
            </p>
          ) : (
            <p className="mt-4 text-sm text-[#5a5470]">
              Cleaner details will appear here once your session is confirmed.
            </p>
          )}
        </section>
      </div>

      {booking.status === "cleaner_en_route" &&
      booking.cleaner_live_latitude !== null &&
      booking.cleaner_live_longitude !== null &&
      destination ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Cleaner en route</h2>
          <CleanerMap
            cleaner={{
              lat: Number(booking.cleaner_live_latitude),
              lng: Number(booking.cleaner_live_longitude),
            }}
            destination={destination}
          />
        </section>
      ) : null}

      {["awaiting_customer_confirmation", "completed"].includes(booking.status) &&
      checklistItems.length > 0 &&
      !hasCompletionConfirmation ? (
        <CompletionChecklistConfirmation
          bookingId={booking.id}
          items={checklistItems}
          onConfirmed={() => {
            setBooking((current) => ({ ...current, status: "completed" }));
            router.refresh();
          }}
        />
      ) : null}

      {booking.status === "completed" && booking.cleaner_id ? (
        <section className="rounded-xl border bg-background p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">How was your clean?</h2>
              <p className="text-sm text-muted-foreground">
                Share a simple mood rating. Mundoria uses this internally for
                fair medallion scoring.
              </p>
            </div>
            {!hasRating ? (
              <Button
                className="min-h-11 w-full sm:w-auto"
                onClick={() => setShowRating(true)}
              >
                Leave a rating
              </Button>
            ) : (
              <span className="text-sm font-medium text-primary">Rated</span>
            )}
          </div>
        </section>
      ) : null}

      {showCancel ? (
        <ConfirmModal
          action="Confirm cancellation"
          confirmDisabled={reason.trim().length < 3}
          description={
            feePreview.feePence <= 0
              ? "Free cancellation — you’re more than 48 hours before the visit. Eligible refunds go to your original payment method."
              : feePreview.feePence >= Number(booking.amount_total ?? 0)
                ? "Within 24 hours of the visit, the full booking amount is retained. Tell us why you’re cancelling."
                : `Within 48 hours of the visit, a ${formatMoney(feePreview.feePence)} cancellation fee applies. The rest is refunded to your original payment method.`
          }
          onCancel={() => setShowCancel(false)}
          onConfirm={cancelBooking}
          title="Cancel this booking?"
        >
          <textarea
            className="min-h-24 w-full rounded-md border p-3 text-sm"
            onChange={(event) => setReason(event.target.value)}
            placeholder="Cancellation reason"
            value={reason}
          />
          {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
        </ConfirmModal>
      ) : null}

      {showPay ? (
        <FollowOnPayModal
          amount={Number(booking.amount_total ?? 0)}
          bookingId={booking.id}
          onClose={() => setShowPay(false)}
          onPaid={() => {
            setShowPay(false);
            success({
              kind: "sent",
              title: "Payment authorised",
              note: "We’re looking for your cleaner — you’ll see confirmation once they accept.",
            });
            router.refresh();
          }}
        />
      ) : null}

      {showReschedule ? (
        <RescheduleModal
          bookingId={booking.id}
          durationHours={booking.estimated_duration_hours ?? 2}
          initialDate={booking.scheduled_date}
          initialTime={booking.scheduled_start_time}
          onClose={() => setShowReschedule(false)}
          onSaved={({ date, time }) => {
            setShowReschedule(false);
            setBooking((current) => ({
              ...current,
              scheduled_date: date,
              scheduled_start_time: time,
            }));
            success({
              kind: "sent",
              title: "Visit rescheduled",
              note: "Your cleaner will be asked to confirm the new time if already assigned.",
            });
            router.refresh();
          }}
        />
      ) : null}

      {showRating && booking.cleaner_id ? (
        <Modal title="Rate your clean" onClose={() => setShowRating(false)}>
          <RatingForm
            bookingId={booking.id}
            cleanerId={booking.cleaner_id}
            customerId={customerId}
            onSubmitted={() => {
              setShowRating(false);
              success({
                kind: "sent",
                title: "Thanks for the rating",
                note: "Your cleaner will see the feedback.",
              });
              router.refresh();
            }}
          />
        </Modal>
      ) : null}

      {showDispute ? (
        <Modal title="Report an issue" onClose={() => setShowDispute(false)}>
          <GuidedDisputeForm
            bookingId={booking.id}
            onSubmitted={() => {
              setShowDispute(false);
              success({
                kind: "sent",
                title: "Issue reported",
                note: "Our team will take a look and get back to you.",
              });
              router.refresh();
            }}
          />
        </Modal>
      ) : null}
    </div>
  );
}

function LookingForCleanerCard({
  confirmByLabel,
}: {
  confirmByLabel: string | null;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#e8e0f5] bg-gradient-to-b from-[#f6f2ff] to-white">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:gap-8 sm:p-6">
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center rounded-full bg-[#312c79]/10 px-2.5 py-1 text-xs font-semibold text-[#312c79]">
            In progress
          </span>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-[#312c79] sm:text-2xl">
            We are looking for your cleaner
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#4a4468] sm:text-base">
            {confirmByLabel
              ? `Your session will be confirmed no later than ${confirmByLabel}.`
              : "Your session will be confirmed shortly — we’ll email you as soon as a cleaner accepts."}
          </p>
        </div>
        <div
          aria-hidden
          className="mx-auto flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_0_0_6px_rgba(255,255,255,0.9),0_12px_28px_rgba(49,44,121,0.12)] sm:mx-0 sm:h-32 sm:w-32"
        >
          <Hourglass className="h-12 w-12 text-[#d4694a] sm:h-14 sm:w-14" strokeWidth={1.5} />
        </div>
      </div>
    </section>
  );
}

function frequencyLabelForBooking(booking: Booking) {
  if (!booking.is_recurring) return "Once";
  if (booking.recurrence_pattern === "weekly") return "Once a week";
  if (booking.recurrence_pattern === "fortnightly") return "Once a fortnight";
  if (booking.recurrence_pattern === "monthly") return "Once a month";
  if (booking.recurrence_pattern === "custom") return "Custom calendar";
  return "Recurring";
}

function petsFromNotes(notes: string | null) {
  if (!notes) return null;
  if (/pets present/i.test(notes)) return true;
  if (/no pets/i.test(notes)) return false;
  return null;
}

function Modal({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-background p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl sm:rounded-2xl sm:p-6 sm:pb-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="min-w-0 break-words text-lg font-semibold sm:text-xl">
            {title}
          </h2>
          <Button
            className="h-11 w-11 shrink-0"
            onClick={onClose}
            size="icon"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Notice({ body, title }: { body: string; title: string }) {
  return (
    <div className="rounded-xl bg-emerald-100 p-4 text-emerald-950">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm">{body}</p>
    </div>
  );
}
