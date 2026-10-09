"use client";

import {
  Check,
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
import { TipPanel } from "@/components/customer/tip-panel";
import { RatingForm } from "@/components/customer/rating-form";
import { RescheduleModal } from "@/components/customer/reschedule-modal";
import { BookingStatusBadge } from "@/components/shared/booking-status-badge";
import { ActionError } from "@/components/shared/action-error";
import { avatarImageClass, resolveAvatarUrl } from "@/lib/avatars/default-pack";
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
  const [cancelScope, setCancelScope] = useState<"visit" | "series">("visit");
  const [pauseStart, setPauseStart] = useState("");
  const [pauseEnd, setPauseEnd] = useState("");
  const [showPause, setShowPause] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canCancel = useMemo(
    () =>
      canCustomerChangeSchedule({
        actualStartTime: booking.actual_start_time,
        checkinVerified: booking.checkin_verified,
        scheduledDate: booking.scheduled_date,
        scheduledStartTime: booking.scheduled_start_time,
        status: booking.status,
      }),
    [booking],
  );
  const canReschedule = useMemo(
    () =>
      canCustomerReschedule({
        actualStartTime: booking.actual_start_time,
        checkinVerified: booking.checkin_verified,
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
    booking.service_type !== "regular" &&
    booking.payment_status === "unpaid" &&
    booking.status !== "cancelled";
  const canChangePro =
    canCancel &&
    Boolean(booking.cleaner_id) &&
    (!booking.is_recurring || Boolean(booking.parent_booking_id));
  const tipOpen = useMemo(() => {
    if (Number(booking.tip_pence ?? 0) > 0) return false;
    if (!["completed", "awaiting_customer_confirmation"].includes(booking.status)) {
      return false;
    }
    const finished = new Date(
      booking.actual_end_time ?? booking.updated_at,
    ).getTime();
    return Date.now() - finished < 24 * 60 * 60 * 1000;
  }, [booking]);

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
      body: JSON.stringify({ reason, scope: cancelScope }),
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

  async function changePro() {
    setError(null);
    const response = await fetch(`/api/bookings/${booking.id}/change-pro`, {
      method: "POST",
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error ?? "Unable to change pro.");
      return;
    }
    success({
      kind: "sent",
      title: "Looking for another pro",
      note: booking.is_recurring
        ? "The remaining visits are cancelled and we are searching again."
        : "We have started a new search.",
    });
    router.refresh();
  }

  async function pauseSeries() {
    setError(null);
    const response = await fetch(`/api/bookings/${booking.id}/pause`, {
      body: JSON.stringify({ endsOn: pauseEnd, startsOn: pauseStart }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error ?? "Unable to pause this regular clean.");
      return;
    }
    setShowPause(false);
    success({
      kind: "done",
      title: "Regular clean paused",
      note: "Visits in those dates are skipped. They resume on their own after the pause.",
    });
    router.refresh();
  }

  async function confirmStart() {
    setError(null);
    const response = await fetch(`/api/bookings/${booking.id}/start`, {
      body: JSON.stringify({ role: "customer" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as {
      error?: string;
      penaltyPence?: number;
      started?: boolean;
    };
    if (!response.ok) {
      setError(result.error ?? "Unable to confirm the start.");
      return;
    }
    success({
      kind: "done",
      title: result.started ? "Cleaning has started" : "Waiting for your cleaner",
      note: result.started
        ? result.penaltyPence
          ? `A waiting charge of £${(result.penaltyPence / 100).toFixed(2)} applies after the 5-minute grace.`
          : "You both confirmed, so the clean has started."
        : "Your cleaner still needs to tap Start cleaning.",
    });
    router.refresh();
  }

  async function sendSos() {
    const response = await fetch(`/api/bookings/${booking.id}/sos`, {
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error ?? "Unable to send the alert.");
      return;
    }
    success({
      kind: "sent",
      title: "Emergency alert sent",
      note: "Mundoria has been told.",
    });
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
          {canChangePro ? (
            <Button
              className="min-h-11 w-full sm:w-auto"
              onClick={() => void changePro()}
              variant="outline"
            >
              Change pro
            </Button>
          ) : null}
          {booking.is_recurring && canCancel ? (
            <Button
              className="min-h-11 w-full sm:w-auto"
              onClick={() => setShowPause(true)}
              variant="outline"
            >
              Pause for a holiday
            </Button>
          ) : null}
          {booking.arrived_at && !booking.customer_start_confirmed_at ? (
            <Button
              className="min-h-11 w-full sm:w-auto"
              onClick={() => void confirmStart()}
            >
              Start cleaning
            </Button>
          ) : null}
          {["confirmed", "cleaner_en_route", "in_progress"].includes(booking.status) ? (
            <Button
              className="min-h-11 w-full sm:w-auto"
              onClick={() => void sendSos()}
              variant="destructive"
            >
              Emergency
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

      {error && !showCancel && !showPause ? (
        <ActionError message={error} title="Something went wrong" />
      ) : null}

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
            standardLabel={null}
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
                    Download invoice
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
                    className={avatarImageClass(
                      resolveAvatarUrl(booking.cleaner.avatar_url, booking.cleaner.id),
                    )}
                    src={resolveAvatarUrl(
                      booking.cleaner.avatar_url,
                      booking.cleaner.id,
                    )}
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
              {booking.cleaner_id ? (
                <Button asChild className="mt-4" size="sm" variant="outline">
                  <Link href={`/booking/new?rebook=${booking.id}&keep=1`}>
                    Book this cleaner again
                  </Link>
                </Button>
              ) : null}
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

      {tipOpen ? (
        <TipPanel bookingId={booking.id} onTipped={() => router.refresh()} />
      ) : null}

      {showPause ? (
        <ConfirmModal
          action="Pause visits"
          confirmDisabled={!pauseStart || !pauseEnd || pauseEnd < pauseStart}
          description="Pick the first and last day you will be away. Visits in between are skipped, then the regular clean carries on by itself."
          onCancel={() => setShowPause(false)}
          onConfirm={() => void pauseSeries()}
          title="Pause this regular clean"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Start
              <input
                className="mt-1 h-11 w-full rounded-xl border px-3"
                onChange={(event) => setPauseStart(event.target.value)}
                type="date"
                value={pauseStart}
              />
            </label>
            <label className="text-sm font-medium">
              End
              <input
                className="mt-1 h-11 w-full rounded-xl border px-3"
                onChange={(event) => setPauseEnd(event.target.value)}
                type="date"
                value={pauseEnd}
              />
            </label>
          </div>
          {error ? (
            <div className="mt-2">
              <ActionError message={error} title="Couldn’t pause this clean" />
            </div>
          ) : null}
        </ConfirmModal>
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
          {booking.is_recurring ? (
            <div className="mb-3 grid gap-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  checked={cancelScope === "visit"}
                  name="cancel-scope"
                  onChange={() => setCancelScope("visit")}
                  type="radio"
                />
                This visit only
              </label>
              <label className="flex items-center gap-2">
                <input
                  checked={cancelScope === "series"}
                  name="cancel-scope"
                  onChange={() => setCancelScope("series")}
                  type="radio"
                />
                This visit and all future visits
              </label>
            </div>
          ) : null}
          <textarea
            autoFocus
            className="min-h-24 w-full rounded-2xl border border-[#d9ccef] bg-white px-4 py-3 text-sm text-[#1c133b] outline-none ring-[#6a45b8] placeholder:text-[#8b8798] focus:ring-2"
            onChange={(event) => setReason(event.target.value)}
            placeholder="Cancellation reason. Write “I want another pro” to search again instead of cancelling a one-off."
            value={reason}
          />
          {error ? (
            <div className="mt-2">
              <ActionError message={error} title="Couldn’t cancel this booking" />
            </div>
          ) : null}
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
  const steps = [
    { label: "Booked", state: "done" as const },
    { label: "Finding a cleaner", state: "current" as const },
    { label: "Confirmed", state: "next" as const },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-[#e6e8ee] bg-white">
      <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#d4694a]">
            <span className="h-2 w-2 rounded-full bg-[#d4694a]" />
            Finding your cleaner
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#1c133b] sm:text-2xl">
            We are looking for your cleaner
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#5c6570]">
            Their name stays hidden until they accept. You’ll get an email when
            the session is confirmed.
          </p>
        </div>
        <div className="rounded-2xl bg-[#f7f4fb] px-4 py-3.5 sm:px-5 lg:min-w-[17rem] lg:text-right">
          <p className="text-xs font-medium text-[#8b8798]">
            {confirmByLabel ? "Confirmed no later than" : "Confirmation"}
          </p>
          <p className="mt-1 text-base font-semibold leading-6 text-[#312c79] sm:text-lg">
            {confirmByLabel ?? "We’ll email you as soon as a cleaner accepts."}
          </p>
        </div>
      </div>
      <ol className="grid grid-cols-3 border-t border-[#eef0f4]">
        {steps.map((step) => (
          <li className="px-2 py-3.5 text-center sm:py-4" key={step.label}>
            <span
              className={cn(
                "mx-auto flex h-6 w-6 items-center justify-center rounded-full",
                step.state === "done" && "bg-[#312c79] text-white",
                step.state === "current" &&
                  "bg-[#fff1ea] text-[#d4694a] ring-2 ring-[#d4694a]",
                step.state === "next" && "bg-[#f3f4f6] text-[#9aa1ab]",
              )}
            >
              {step.state === "done" ? (
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
              )}
            </span>
            <span
              className={cn(
                "mt-2 block text-[11px] font-medium leading-4 sm:text-xs",
                step.state === "next" ? "text-[#9aa1ab]" : "text-[#1c133b]",
              )}
            >
              {step.label}
            </span>
          </li>
        ))}
      </ol>
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
