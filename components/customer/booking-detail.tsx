"use client";

import {
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  MessageCircle,
  ShieldCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { CleanerMap } from "@/components/customer/cleaner-map";
import { CompletionChecklistConfirmation } from "@/components/customer/completion-checklist-confirmation";
import { RatingForm } from "@/components/customer/rating-form";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { GuidedDisputeForm } from "@/components/shared/guided-dispute-form";
import { Button } from "@/components/ui/button";
import {
  formatMoney,
  formatServiceName,
  standardLabel,
} from "@/lib/customer/services";
import { cleanerTierLabel } from "@/lib/cleaner/tier";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Booking, BookingChecklistItem } from "@/types/customer";

const progress = [
  "pending_match",
  "matched",
  "confirmed",
  "cleaner_en_route",
  "in_progress",
  "awaiting_customer_confirmation",
  "completed",
] as const;

export function BookingDetail({
  checklistItems,
  customerId,
  hasCompletionConfirmation,
  hasRating,
  initialBooking,
}: {
  checklistItems: BookingChecklistItem[];
  customerId: string;
  hasCompletionConfirmation: boolean;
  hasRating: boolean;
  initialBooking: Booking;
}) {
  const router = useRouter();
  const [booking, setBooking] = useState(initialBooking);
  const [showCancel, setShowCancel] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [showRating, setShowRating] = useState(
    booking.status === "completed" && !hasRating,
  );
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const canCancel = useMemo(() => {
    const scheduled = new Date(
      `${booking.scheduled_date}T${booking.scheduled_start_time}`,
    );
    return (
      scheduled.getTime() - Date.now() > 6 * 60 * 60 * 1000 &&
      ["pending_match", "matched", "confirmed"].includes(booking.status)
    );
  }, [booking]);

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
          setBooking((current) => ({
            ...current,
            ...(payload.new as Booking),
          }));
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
  }, [booking.id]);

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
    router.refresh();
  }

  const activeIndex = progress.indexOf(
    booking.status === "disputed" ? "completed" : booking.status as typeof progress[number],
  );
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Booking</p>
          <h1 className="mt-1 text-3xl font-semibold">
            {formatServiceName(booking.service_type)}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">#{booking.id.slice(0, 8)}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowDispute(true)} variant="outline">
            Report issue
          </Button>
          {booking.cleaner_id ? (
            <Button asChild variant="outline">
              <Link href={`/messages/${booking.id}`}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Message
              </Link>
            </Button>
          ) : null}
          {canCancel ? (
            <Button onClick={() => setShowCancel(true)} variant="destructive">
              Cancel booking
            </Button>
          ) : null}
        </div>
      </div>

      {booking.status !== "cancelled" ? (
        <section className="overflow-x-auto rounded-xl border bg-background p-5">
          <div className="flex min-w-[640px] items-start">
            {progress.map((status, index) => (
              <div className="flex flex-1 items-start" key={status}>
                <div className="flex flex-col items-center text-center">
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold",
                      index <= activeIndex
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-card text-muted-foreground",
                    )}
                  >
                    {index < activeIndex ? <Check className="h-4 w-4" /> : index + 1}
                  </span>
                  <span className="mt-2 text-xs capitalize">
                    {status.replaceAll("_", " ")}
                  </span>
                </div>
                {index < progress.length - 1 ? (
                  <span
                    className={cn(
                      "mt-4 h-0.5 flex-1",
                      index < activeIndex ? "bg-primary" : "bg-muted",
                    )}
                  />
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="rounded-xl bg-muted p-4 text-sm text-foreground">
          This booking was cancelled. Its payment authorization was voided.
        </div>
      )}

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

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-xl border bg-background p-5">
          <h2 className="text-lg font-semibold">Booking details</h2>
          <div className="mt-5 space-y-4 text-sm">
            <Detail
              icon={ShieldCheck}
              label="Cleaning standard"
              value={standardLabel(booking.cleaning_standard ?? "enhanced")}
            />
            <Detail
              icon={CalendarDays}
              label="Date"
              value={new Date(
                `${booking.scheduled_date}T12:00:00`,
              ).toLocaleDateString("en-GB", {
                dateStyle: "long",
              })}
            />
            <Detail
              icon={Clock3}
              label="Time"
              value={booking.scheduled_start_time.slice(0, 5)}
            />
            <Detail
              icon={MapPin}
              label="Address"
              value={
                booking.address
                  ? `${booking.address.address_line_1}, ${booking.address.city}, ${booking.address.postcode}`
                  : "Unavailable"
              }
            />
            {booking.special_attention_areas?.length ? (
              <Detail
                icon={Check}
                label="Special attention"
                value={booking.special_attention_areas.join(", ")}
              />
            ) : null}
            {booking.add_ons?.length ? (
              <Detail
                icon={Check}
                label="Add-ons"
                value={booking.add_ons
                  .map((addOn) => `${addOn.label} (${formatMoney(addOn.amount)})`)
                  .join(", ")}
              />
            ) : null}
            <Detail
              icon={ShieldCheck}
              label="Payment authorization"
              value={formatMoney(booking.amount_total)}
            />
            {["completed", "awaiting_customer_confirmation"].includes(
              booking.status,
            ) || booking.payment_status === "released" ? (
              <div className="pt-1">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/booking/${booking.id}/receipt`}>
                    View receipt / invoice
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-xl border bg-background p-5">
          <h2 className="text-lg font-semibold">Your cleaner</h2>
          {booking.cleaner ? (
            <div className="mt-5 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-lg font-bold text-primary">
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
              <div>
                <p className="font-semibold">{booking.cleaner.full_name}</p>
                <div className="mt-1 flex items-center gap-2 text-sm">
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold capitalize text-amber-800">
                    {cleanerTierLabel(booking.cleaner.tier)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    CleanScape medallion
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              We’re matching you with the best available cleaner.
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
        <section className="rounded-xl border bg-background p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">How was your clean?</h2>
              <p className="text-sm text-muted-foreground">
                Share a simple mood rating. CleanScape uses this internally for
                fair medallion scoring.
              </p>
            </div>
            {!hasRating ? (
              <Button onClick={() => setShowRating(true)}>Leave a rating</Button>
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
          description="Your payment authorization will be voided. Tell us why you’re cancelling."
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

      {showRating && booking.cleaner_id ? (
        <Modal title="Rate your clean" onClose={() => setShowRating(false)}>
          <RatingForm
            bookingId={booking.id}
            cleanerId={booking.cleaner_id}
            customerId={customerId}
            onSubmitted={() => {
              setShowRating(false);
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
              router.refresh();
            }}
          />
        </Modal>
      ) : null}
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-5 w-5 text-primary" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 font-medium">{value}</p>
      </div>
    </div>
  );
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-background p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button onClick={onClose} size="icon" variant="ghost">
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
