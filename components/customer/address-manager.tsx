"use client";

import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import { Check, MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Address } from "@/types/customer";

const libraries: "places"[] = ["places"];

export interface AddressFormValues {
  address_line_1: string;
  address_line_2: string;
  city: string;
  is_default: boolean;
  label: string;
  latitude: number | null;
  longitude: number | null;
  num_bathrooms: number;
  num_bedrooms: number;
  postcode: string;
  property_type: "house" | "flat" | "office" | "other";
  special_requirements: string;
}

const emptyAddress: AddressFormValues = {
  address_line_1: "",
  address_line_2: "",
  city: "",
  is_default: false,
  label: "Home",
  latitude: null,
  longitude: null,
  num_bathrooms: 1,
  num_bedrooms: 1,
  postcode: "",
  property_type: "flat",
  special_requirements: "",
};

export function AddressManager({
  initialAddresses,
  userId,
}: {
  initialAddresses: Address[];
  userId: string;
}) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [editing, setEditing] = useState<Address | null>(null);
  const [showForm, setShowForm] = useState(false);

  function handleSaved(address: Address) {
    setAddresses((current) => {
      const next = address.is_default
        ? current.map((item) => ({ ...item, is_default: false }))
        : current;
      const exists = next.some((item) => item.id === address.id);
      return exists
        ? next.map((item) => (item.id === address.id ? address : item))
        : [address, ...next];
    });
    setEditing(null);
    setShowForm(false);
  }

  async function removeAddress(address: Address) {
    if (!window.confirm(`Delete ${address.label ?? "this address"}?`)) return;

    const { error } = await createBrowserClient()
      .from("addresses")
      .delete()
      .eq("id", address.id);

    if (!error) {
      setAddresses((current) =>
        current.filter((item) => item.id !== address.id),
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Saved addresses
          </h1>
          <p className="mt-2 text-muted-foreground">
            Keep property details ready for faster booking.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add address
        </Button>
      </div>

      {(showForm || editing) && (
        <div className="rounded-xl border bg-background p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {editing ? "Edit address" : "New address"}
            </h2>
            <Button
              onClick={() => {
                setEditing(null);
                setShowForm(false);
              }}
              size="icon"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <AddressForm
            address={editing}
            onSaved={handleSaved}
            userId={userId}
          />
        </div>
      )}

      {addresses.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <article
              className="rounded-xl border bg-card p-5 shadow-sm"
              key={address.id}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <span className="rounded-full bg-emerald-100 p-2 text-primary">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">
                        {address.label ?? "Address"}
                      </h2>
                      {address.is_default ? (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          Default
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {address.address_line_1}
                      {address.address_line_2
                        ? `, ${address.address_line_2}`
                        : ""}
                      <br />
                      {address.city}, {address.postcode}
                    </p>
                    <p className="mt-3 text-xs capitalize text-muted-foreground">
                      {address.property_type ?? "Property"} ·{" "}
                      {address.num_bedrooms ?? 0} bed ·{" "}
                      {address.num_bathrooms ?? 0} bath
                    </p>
                  </div>
                </div>
                <div className="flex">
                  <Button
                    aria-label="Edit address"
                    onClick={() => {
                      setEditing(address);
                      setShowForm(false);
                    }}
                    size="icon"
                    variant="ghost"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    aria-label="Delete address"
                    onClick={() => void removeAddress(address)}
                    size="icon"
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed bg-background p-10 text-center">
          <MapPin className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No saved addresses</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first property to get booking.
          </p>
        </div>
      )}
    </div>
  );
}

export function AddressForm({
  address,
  compact = false,
  onSaved,
  userId,
}: {
  address?: Address | null;
  compact?: boolean;
  onSaved: (address: Address) => void;
  userId: string;
}) {
  const [values, setValues] = useState<AddressFormValues>(() =>
    address
      ? {
          address_line_1: address.address_line_1,
          address_line_2: address.address_line_2 ?? "",
          city: address.city,
          is_default: address.is_default,
          label: address.label ?? "Home",
          latitude: address.latitude,
          longitude: address.longitude,
          num_bathrooms: address.num_bathrooms ?? 1,
          num_bedrooms: address.num_bedrooms ?? 1,
          postcode: address.postcode,
          property_type: address.property_type ?? "flat",
          special_requirements: address.special_requirements ?? "",
        }
      : emptyAddress,
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  function update<K extends keyof AddressFormValues>(
    key: K,
    value: AddressFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function useSelectedPlace(place: google.maps.places.PlaceResult) {
    if (!place?.address_components) return;

    const component = (type: string) =>
      place.address_components?.find((item) => item.types.includes(type))
        ?.long_name ?? "";
    const streetNumber = component("street_number");
    const route = component("route");

    setValues((current) => ({
      ...current,
      address_line_1:
        [streetNumber, route].filter(Boolean).join(" ") ||
        place.formatted_address ||
        current.address_line_1,
      city:
        component("postal_town") ||
        component("locality") ||
        component("administrative_area_level_2"),
      latitude: place.geometry?.location?.lat() ?? null,
      longitude: place.geometry?.location?.lng() ?? null,
      postcode: component("postal_code"),
    }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (
      !values.address_line_1.trim() ||
      !values.city.trim() ||
      !values.postcode.trim()
    ) {
      setError("Address line, city, and postcode are required.");
      return;
    }

    setSaving(true);
    const supabase = createBrowserClient();

    if (values.is_default) {
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("customer_id", userId)
        .neq("id", address?.id ?? "00000000-0000-0000-0000-000000000000");
    }

    const payload = {
      ...values,
      address_line_1: values.address_line_1.trim(),
      address_line_2: values.address_line_2.trim() || null,
      city: values.city.trim(),
      customer_id: userId,
      label: values.label.trim() || null,
      postcode: values.postcode.trim().toUpperCase(),
      special_requirements: values.special_requirements.trim() || null,
    };
    const query = address
      ? supabase
          .from("addresses")
          .update(payload)
          .eq("id", address.id)
          .select()
          .single()
      : supabase.from("addresses").insert(payload).select().single();
    const { data, error: saveError } = await query;

    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }

    onSaved(data as Address);
  }

  const addressInput = (
    <Input
      onChange={(event) => update("address_line_1", event.target.value)}
      placeholder="Start typing your address"
      required
      value={values.address_line_1}
    />
  );

  return (
    <form className="space-y-4" onSubmit={submit}>
      {error ? (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Field label="Find address">
        {mapsKey ? (
          <AddressAutocompleteInput
            apiKey={mapsKey}
            input={addressInput}
            onPlaceSelected={useSelectedPlace}
          />
        ) : (
          addressInput
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Label">
          <Input
            onChange={(event) => update("label", event.target.value)}
            placeholder="Home"
            value={values.label}
          />
        </Field>
        <Field label="Flat, unit or building">
          <Input
            onChange={(event) => update("address_line_2", event.target.value)}
            value={values.address_line_2}
          />
        </Field>
        <Field label="City">
          <Input
            onChange={(event) => update("city", event.target.value)}
            required
            value={values.city}
          />
        </Field>
        <Field label="Postcode">
          <Input
            onChange={(event) => update("postcode", event.target.value)}
            required
            value={values.postcode}
          />
        </Field>
        <Field label="Property type">
          <select
            className="h-11 w-full rounded-md border bg-background px-3 text-sm"
            onChange={(event) =>
              update(
                "property_type",
                event.target.value as AddressFormValues["property_type"],
              )
            }
            value={values.property_type}
          >
            <option value="house">House</option>
            <option value="flat">Flat</option>
            <option value="office">Office</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Bedrooms">
            <Input
              min={0}
              onChange={(event) =>
                update("num_bedrooms", Number(event.target.value))
              }
              type="number"
              value={values.num_bedrooms}
            />
          </Field>
          <Field label="Bathrooms">
            <Input
              min={0}
              onChange={(event) =>
                update("num_bathrooms", Number(event.target.value))
              }
              type="number"
              value={values.num_bathrooms}
            />
          </Field>
        </div>
      </div>

      {!compact ? (
        <Field label="Special requirements">
          <textarea
            className="min-h-24 w-full rounded-md border bg-background p-3 text-sm"
            onChange={(event) =>
              update("special_requirements", event.target.value)
            }
            placeholder="Pets, access notes, preferred products…"
            value={values.special_requirements}
          />
        </Field>
      ) : null}

      <label className="flex items-center gap-3 text-sm">
        <input
          checked={values.is_default}
          className="h-4 w-4 accent-emerald-700"
          onChange={(event) => update("is_default", event.target.checked)}
          type="checkbox"
        />
        Make this my default address
      </label>

      <Button disabled={saving} type="submit">
        {saving ? (
          "Saving…"
        ) : (
          <>
            <Check className="mr-2 h-4 w-4" />
            Save address
          </>
        )}
      </Button>
    </form>
  );
}

function AddressAutocompleteInput({
  apiKey,
  input,
  onPlaceSelected,
}: {
  apiKey: string;
  input: React.ReactElement;
  onPlaceSelected: (place: google.maps.places.PlaceResult) => void;
}) {
  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    id: "cleanscape-google-maps",
    libraries,
  });

  if (!isLoaded) return input;

  return (
    <Autocomplete
      onLoad={setAutocomplete}
      onPlaceChanged={() => {
        const place = autocomplete?.getPlace();
        if (place) onPlaceSelected(place);
      }}
    >
      {input}
    </Autocomplete>
  );
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}
