"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ActionError } from "@/components/shared/action-error";
import { useFeedback } from "@/components/shared/feedback-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SERVICES, SERVICE_ADD_ONS } from "@/lib/customer/services";

const ASSISTED_SERVICES = SERVICES.filter((service) =>
  ["residential", "moving_home", "short_term_rental"].includes(service.category),
);

const selectClass =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm";

export function AssistedCustomerForm() {
  const router = useRouter();
  const { success } = useFeedback();
  const [person, setPerson] = useState({ email: "", firstName: "", lastName: "", phone: "" });
  const [withBooking, setWithBooking] = useState(true);
  const [booking, setBooking] = useState({
    accessNotes: "",
    bathrooms: "1",
    bedrooms: "1",
    city: "",
    cleaningStandard: "",
    durationHours: "2.5",
    frequency: "once",
    hasPets: "",
    house: "",
    notes: "",
    postcode: "",
    propertyType: "flat",
    scheduledDate: "",
    scheduledTime: "09:00",
    serviceType: "regular",
    street: "",
  });
  const [addOns, setAddOns] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ bookingLink: string | null; emailSent: boolean; newAccount: boolean } | null>(null);

  const service = ASSISTED_SERVICES.find((item) => item.value === booking.serviceType);
  const availableAddOns = useMemo(
    () =>
      SERVICE_ADD_ONS.filter(
        (addOn) => !addOn.categories || (service && addOn.categories.includes(service.category)),
      ),
    [service],
  );
  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);

  function setB<K extends keyof typeof booking>(key: K, value: string) {
    setBooking((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (withBooking && booking.hasPets === "") {
      setError("Say whether there are pets at the property.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/admin/customers", {
        body: JSON.stringify({
          ...person,
          booking: withBooking
            ? {
                accessNotes: booking.accessNotes,
                addOns: addOns.filter((id) => availableAddOns.some((addOn) => addOn.id === id)),
                bathrooms: Number(booking.bathrooms),
                bedrooms: Number(booking.bedrooms),
                city: booking.city,
                cleaningStandard: booking.cleaningStandard || undefined,
                durationHours: Number(booking.durationHours),
                frequency: booking.frequency,
                hasPets: booking.hasPets === "yes",
                house: booking.house,
                notes: booking.notes,
                postcode: booking.postcode,
                propertyType: booking.propertyType,
                scheduledDate: booking.scheduledDate,
                scheduledTime: booking.scheduledTime,
                serviceType: booking.serviceType,
                street: booking.street,
              }
            : null,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = (await response.json().catch(() => ({}))) as {
        bookingLink?: string | null;
        emailSent?: boolean;
        error?: string;
        newAccount?: boolean;
      };
      if (!response.ok) {
        setError(data.error ?? "Couldn’t do that. Check the details and try again.");
        return;
      }
      setResult({
        bookingLink: data.bookingLink ?? null,
        emailSent: Boolean(data.emailSent),
        newAccount: Boolean(data.newAccount),
      });
      success({
        kind: "saved",
        note: data.emailSent
          ? "We've emailed them. They add their own card to confirm."
          : "The email didn't send. Share the booking link with them instead.",
        title: data.newAccount ? "Account created" : "Booking sent to confirm",
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="space-y-3 rounded-xl border bg-card p-4 sm:p-5">
        <p className="font-semibold">
          {result.newAccount ? "Account created." : "Booking prepared on their existing account."}
        </p>
        <p className="text-sm text-muted-foreground">
          {result.emailSent
            ? result.newAccount
              ? "They've been emailed a link to set their password. It then opens their booking to check and add a card."
              : "They've been emailed a link to check the booking and add a card."
            : "The email didn't send, so share the link below with them."}{" "}
          The booking is only made once they confirm, and nothing is charged until a cleaner is confirmed.
        </p>
        {result.bookingLink ? (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Booking link (works once they&apos;re signed in; you can also text it to them)
            </p>
            <Input onFocus={(event) => event.currentTarget.select()} readOnly value={result.bookingLink} />
          </div>
        ) : null}
        <Button onClick={() => window.location.reload()} type="button" variant="outline">
          Help another customer
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-6 rounded-xl border bg-card p-4 sm:p-5" onSubmit={submit}>
      <section className="space-y-3">
        <h2 className="font-semibold">Customer</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name">
            <Input onChange={(e) => setPerson({ ...person, firstName: e.target.value })} required value={person.firstName} />
          </Field>
          <Field label="Last name">
            <Input onChange={(e) => setPerson({ ...person, lastName: e.target.value })} value={person.lastName} />
          </Field>
          <Field label="Email">
            <Input onChange={(e) => setPerson({ ...person, email: e.target.value })} required type="email" value={person.email} />
          </Field>
          <Field label="Mobile">
            <Input inputMode="tel" onChange={(e) => setPerson({ ...person, phone: e.target.value })} required value={person.phone} />
          </Field>
        </div>
      </section>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input checked={withBooking} className="h-4 w-4" onChange={(e) => setWithBooking(e.target.checked)} type="checkbox" />
        Prepare a booking for them
      </label>

      {withBooking ? (
        <>
          <section className="space-y-3">
            <h2 className="font-semibold">The clean</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Service">
                <select className={selectClass} onChange={(e) => setB("serviceType", e.target.value)} value={booking.serviceType}>
                  {ASSISTED_SERVICES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Cleaning standard">
                <select className={selectClass} onChange={(e) => setB("cleaningStandard", e.target.value)} value={booking.cleaningStandard}>
                  <option value="">Recommended for this service</option>
                  <option value="essential">Essential</option>
                  <option value="enhanced">Enhanced</option>
                  <option value="comprehensive">Comprehensive</option>
                </select>
              </Field>
              <Field label="Date">
                <Input min={tomorrow} onChange={(e) => setB("scheduledDate", e.target.value)} required type="date" value={booking.scheduledDate} />
              </Field>
              <Field label="Start time">
                <Input onChange={(e) => setB("scheduledTime", e.target.value)} required step={1800} type="time" value={booking.scheduledTime} />
              </Field>
              <Field label="Session length (hours)">
                <Input max={12} min={1} onChange={(e) => setB("durationHours", e.target.value)} required step={0.5} type="number" value={booking.durationHours} />
              </Field>
              <Field label="How often">
                <select className={selectClass} onChange={(e) => setB("frequency", e.target.value)} value={booking.frequency}>
                  <option value="once">One visit</option>
                  <option value="weekly">Weekly</option>
                  <option value="fortnightly">Fortnightly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </Field>
            </div>
            {availableAddOns.length ? (
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Extras</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {availableAddOns.map((addOn) => (
                    <label className="flex items-center gap-2 text-sm" key={addOn.id}>
                      <input
                        checked={addOns.includes(addOn.id)}
                        className="h-4 w-4"
                        onChange={(e) =>
                          setAddOns((current) =>
                            e.target.checked ? [...current, addOn.id] : current.filter((id) => id !== addOn.id),
                          )
                        }
                        type="checkbox"
                      />
                      {addOn.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold">Address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="House or flat number / name">
                <Input onChange={(e) => setB("house", e.target.value)} required value={booking.house} />
              </Field>
              <Field label="Street">
                <Input onChange={(e) => setB("street", e.target.value)} required value={booking.street} />
              </Field>
              <Field label="Town or city">
                <Input onChange={(e) => setB("city", e.target.value)} required value={booking.city} />
              </Field>
              <Field label="Postcode">
                <Input onChange={(e) => setB("postcode", e.target.value)} required value={booking.postcode} />
              </Field>
              <Field label="Property type">
                <select className={selectClass} onChange={(e) => setB("propertyType", e.target.value)} value={booking.propertyType}>
                  <option value="flat">Flat</option>
                  <option value="house">House</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="Pets at the property?">
                <select className={selectClass} onChange={(e) => setB("hasPets", e.target.value)} value={booking.hasPets}>
                  <option value="">Choose…</option>
                  <option value="no">No pets</option>
                  <option value="yes">Yes, pets</option>
                </select>
              </Field>
              <Field label="Bedrooms">
                <Input max={12} min={0} onChange={(e) => setB("bedrooms", e.target.value)} required type="number" value={booking.bedrooms} />
              </Field>
              <Field label="Bathrooms">
                <Input max={10} min={1} onChange={(e) => setB("bathrooms", e.target.value)} required type="number" value={booking.bathrooms} />
              </Field>
            </div>
            <Field label="Access notes (optional)">
              <Input
                onChange={(e) => setB("accessNotes", e.target.value)}
                placeholder="Parking, door code, key safe…"
                value={booking.accessNotes}
              />
            </Field>
            <Field label="Notes for the cleaner (optional)">
              <textarea
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                onChange={(e) => setB("notes", e.target.value)}
                value={booking.notes}
              />
            </Field>
          </section>
          <p className="text-xs text-muted-foreground">
            The customer sees the full price when they confirm. Office and recovery
            cleans need extra questions, so send those customers the normal booking
            link instead.
          </p>
        </>
      ) : null}

      {error ? <ActionError message={error} title="Couldn’t do that" /> : null}
      <Button disabled={busy} type="submit">
        {busy
          ? "Working…"
          : withBooking
            ? "Create account and send booking"
            : "Create account"}
      </Button>
    </form>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="block space-y-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}
