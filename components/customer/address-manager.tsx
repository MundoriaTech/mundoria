"use client";

import { Check, MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import { cloneElement, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type GeoapifyFeature,
  type GeoapifyAutocompleteResponse,
  getGeoapifyApiKey,
} from "@/lib/maps/geoapify";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Address } from "@/types/customer";

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
}: {
  address?: Address | null;
  compact?: boolean;
  onSaved: (address: Address) => void;
  /** @deprecated Ownership comes from the authenticated session via /api/addresses */
  userId?: string;
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
  const mapsKey = getGeoapifyApiKey();

  function update<K extends keyof AddressFormValues>(
    key: K,
    value: AddressFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function useSelectedPlace(place: GeoapifyFeature) {
    const properties = place.properties;

    setValues((current) => ({
      ...current,
      address_line_1:
        properties.address_line1 ||
        properties.street ||
        properties.formatted ||
        current.address_line_1,
      city:
        properties.city ||
        properties.address_line2 ||
        current.city,
      latitude: properties.lat ?? null,
      longitude: properties.lon ?? null,
      postcode: properties.postcode ?? current.postcode,
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

    const payload = {
      address_line_1: values.address_line_1.trim(),
      address_line_2: values.address_line_2.trim() || null,
      city: values.city.trim(),
      id: address?.id,
      is_default: values.is_default,
      label: values.label.trim() || null,
      latitude: values.latitude,
      longitude: values.longitude,
      num_bathrooms: values.num_bathrooms,
      num_bedrooms: values.num_bedrooms,
      postcode: values.postcode.trim().toUpperCase(),
      property_type: values.property_type,
      special_requirements: values.special_requirements.trim() || null,
    };

    try {
      const response = await fetch("/api/addresses", {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: address ? "PATCH" : "POST",
      });
      const result = (await response.json()) as {
        address?: Address;
        error?: string;
      };

      setSaving(false);

      if (!response.ok || !result.address) {
        setError(result.error ?? "Could not save address.");
        return;
      }

      onSaved(result.address);
    } catch {
      setSaving(false);
      setError("Could not save address. Check your connection and try again.");
    }
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
  onPlaceSelected: (place: GeoapifyFeature) => void;
}) {
  const [query, setQuery] = useState(String(input.props.value ?? ""));
  const [suggestions, setSuggestions] = useState<GeoapifyFeature[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(String(input.props.value ?? ""));
  }, [input.props.value]);

  useEffect(() => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
        url.searchParams.set("apiKey", apiKey);
        url.searchParams.set("filter", "countrycode:gb");
        url.searchParams.set("format", "geojson");
        url.searchParams.set("limit", "6");
        url.searchParams.set("text", query);

        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) return;

        const data = (await response.json()) as GeoapifyAutocompleteResponse;
        setSuggestions(data.features ?? []);
        setOpen(true);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [apiKey, query]);

  return (
    <div className="relative">
      {/** Clone the app's normal input so styling/validation stays identical. */}
      {cloneElement(input, {
        autoComplete: "off",
        onBlur: () => {
          blurTimer.current = setTimeout(() => setOpen(false), 150);
        },
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
          setQuery(event.target.value);
          input.props.onChange?.(event);
        },
        onFocus: () => {
          if (blurTimer.current) clearTimeout(blurTimer.current);
          if (suggestions.length) setOpen(true);
        },
        value: query,
      })}
      {open && (suggestions.length || loading) ? (
        <div className="absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-xl border bg-background p-1 shadow-lg">
          {loading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Searching addresses…
            </div>
          ) : null}
          {suggestions.map((suggestion) => (
            <button
              className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
              key={`${suggestion.properties.lat}-${suggestion.properties.lon}-${suggestion.properties.formatted}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onPlaceSelected(suggestion);
                setQuery(
                  suggestion.properties.address_line1 ||
                    suggestion.properties.formatted ||
                    query,
                );
                setOpen(false);
              }}
              type="button"
            >
              <span className="font-medium">
                {suggestion.properties.address_line1 ||
                  suggestion.properties.formatted}
              </span>
              {suggestion.properties.address_line2 ? (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {suggestion.properties.address_line2}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
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
