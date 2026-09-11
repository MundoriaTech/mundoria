"use client";

import { Check, MapPin, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useFeedback } from "@/components/shared/feedback-provider";
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
  num_other_rooms: number;
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
  num_other_rooms: 0,
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
  const { confirm, error: showError, success } = useFeedback();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [editing, setEditing] = useState<Address | null>(null);
  const [showForm, setShowForm] = useState(false);

  function handleSaved(address: Address) {
    const wasEdit = Boolean(editing);
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
    success({
      kind: wasEdit ? "updated" : "saved",
      title: wasEdit ? "Address updated" : "Address saved",
      note: wasEdit
        ? "Your booking details will use the latest version."
        : "Ready whenever you book your next clean.",
    });
  }

  async function removeAddress(address: Address) {
    const label = address.label ?? "this address";
    const ok = await confirm({
      action: "Delete address",
      description: `Remove ${label} from your saved places? You can always add it again later.`,
      title: "Delete this address?",
      variant: "destructive",
    });
    if (!ok) return;

    const { error } = await createBrowserClient()
      .from("addresses")
      .delete()
      .eq("id", address.id);

    if (error) {
      showError({
        description: error.message,
        title: "Couldn’t delete address",
      });
      return;
    }

    setAddresses((current) =>
      current.filter((item) => item.id !== address.id),
    );
    success({
      kind: "deleted",
      title: "Address removed",
      note: "One less place on the list.",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Saved addresses
          </h1>
          <p className="mt-2 text-muted-foreground">
            Keep property details ready for faster booking.
          </p>
        </div>
        <Button
          className="min-h-11 w-full sm:w-auto"
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
                      {(address.num_other_rooms ?? 0) > 0
                        ? ` · ${address.num_other_rooms} other`
                        : ""}
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
  localOnly = false,
  onSaved,
}: {
  address?: Address | null;
  compact?: boolean;
  /** Collect address in-memory (no sign-in / API). Used in guest booking. */
  localOnly?: boolean;
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
          num_other_rooms: address.num_other_rooms ?? 0,
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

  function applySelectedPlace(place: GeoapifyFeature) {
    const properties = place.properties;

    setValues((current) => ({
      ...current,
      address_line_1:
        properties.formatted ||
        properties.address_line1 ||
        properties.street ||
        current.address_line_1,
      address_line_2: properties.address_line2 || current.address_line_2,
      city: properties.city || properties.address_line2 || current.city,
      latitude: properties.lat ?? null,
      longitude: properties.lon ?? null,
      postcode: properties.postcode ?? current.postcode,
    }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!values.address_line_1.trim()) {
      setError("Start typing and pick an address from the suggestions.");
      return;
    }

    if (!values.city.trim() || !values.postcode.trim()) {
      setError("Pick an address from the suggestions so we can fill city and postcode.");
      return;
    }

    if (localOnly) {
      const now = new Date().toISOString();
      onSaved({
        address_line_1: values.address_line_1.trim(),
        address_line_2: values.address_line_2.trim() || null,
        city: values.city.trim(),
        created_at: now,
        customer_id: "",
        id: `guest-${crypto.randomUUID()}`,
        is_default: false,
        label: values.label.trim() || null,
        latitude: values.latitude,
        longitude: values.longitude,
        num_bathrooms: values.num_bathrooms,
        num_bedrooms: values.num_bedrooms,
        num_other_rooms: values.num_other_rooms,
        postcode: values.postcode.trim().toUpperCase(),
        property_type: values.property_type,
        special_requirements: values.special_requirements.trim() || null,
        updated_at: now,
      });
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
      num_other_rooms: values.num_other_rooms,
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
      placeholder="Enter your address here"
      required
      value={values.address_line_1}
    />
  );

  const showAccountExtras = !compact && !localOnly;

  return (
    <form className="space-y-4" onSubmit={submit}>
      {error ? (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-medium">
          {compact ? "Search address" : "Where will your cleaning take place"}
        </p>
        {mapsKey ? (
          <AddressAutocompleteInput
            apiKey={mapsKey}
            onPlaceSelected={(place) => {
              applySelectedPlace(place);
              if (localOnly && compact) {
                const properties = place.properties;
                const line1 =
                  properties.formatted ||
                  properties.address_line1 ||
                  properties.street ||
                  values.address_line_1;
                const city =
                  properties.city || properties.address_line2 || values.city;
                const postcode = properties.postcode ?? values.postcode;
                if (!city.trim() || !postcode.trim()) {
                  setError(
                    "Pick a suggestion that includes city and postcode.",
                  );
                  return;
                }
                const now = new Date().toISOString();
                onSaved({
                  address_line_1: line1.trim(),
                  address_line_2: properties.address_line2 || null,
                  city: city.trim(),
                  created_at: now,
                  customer_id: "",
                  id: `guest-${crypto.randomUUID()}`,
                  is_default: false,
                  label: values.label.trim() || null,
                  latitude: properties.lat ?? null,
                  longitude: properties.lon ?? null,
                  num_bathrooms: values.num_bathrooms,
                  num_bedrooms: values.num_bedrooms,
                  num_other_rooms: values.num_other_rooms,
                  postcode: postcode.trim().toUpperCase(),
                  property_type: values.property_type,
                  special_requirements:
                    values.special_requirements.trim() || null,
                  updated_at: now,
                });
              }
            }}
            value={values.address_line_1}
            onQueryChange={(next) => update("address_line_1", next)}
          />
        ) : (
          addressInput
        )}
        {values.city && values.postcode ? (
          <p className="text-xs text-muted-foreground">
            {values.city} · {values.postcode.toUpperCase()}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Choose a suggestion so city and postcode fill in automatically.
          </p>
        )}
      </div>

      {showAccountExtras ? (
        <>
          <Field label="Label">
            <Input
              onChange={(event) => update("label", event.target.value)}
              placeholder="Home"
              value={values.label}
            />
          </Field>
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
        </>
      ) : null}

      {!compact && localOnly ? (
        <Button disabled={saving} type="submit">
          <Check className="mr-2 h-4 w-4" />
          Continue with this address
        </Button>
      ) : null}

      {!localOnly && compact ? (
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
      ) : null}
    </form>
  );
}

function AddressAutocompleteInput({
  apiKey,
  onPlaceSelected,
  onQueryChange,
  value,
}: {
  apiKey: string;
  onPlaceSelected: (place: GeoapifyFeature) => void;
  onQueryChange: (value: string) => void;
  value: string;
}) {
  const [suggestions, setSuggestions] = useState<GeoapifyFeature[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
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
        url.searchParams.set("text", value);

        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          setSuggestions([]);
          return;
        }

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
  }, [apiKey, value]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div className="relative z-30" ref={rootRef}>
      <Input
        autoComplete="off"
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 180);
        }}
        onChange={(event) => onQueryChange(event.target.value)}
        onFocus={() => {
          if (blurTimer.current) clearTimeout(blurTimer.current);
          if (suggestions.length) setOpen(true);
        }}
        placeholder="Enter your address here"
        required
        value={value}
      />
      {open && (suggestions.length > 0 || loading) ? (
        <ul
          className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-[80] max-h-72 overflow-auto rounded-xl border border-[#d9ccef] bg-white p-1 shadow-[0_16px_40px_rgba(28,19,59,0.18)]"
          role="listbox"
        >
          {loading ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              Searching addresses…
            </li>
          ) : null}
          {suggestions.map((suggestion) => {
            const primary =
              suggestion.properties.formatted ||
              suggestion.properties.address_line1 ||
              "Address";
            return (
              <li key={`${suggestion.properties.lat}-${suggestion.properties.lon}-${primary}`}>
                <button
                  className="block w-full rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-[#efe6ff] touch-manipulation"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    if (blurTimer.current) clearTimeout(blurTimer.current);
                    const formatted =
                      suggestion.properties.formatted ||
                      suggestion.properties.address_line1 ||
                      value;
                    onQueryChange(formatted);
                    onPlaceSelected(suggestion);
                    setOpen(false);
                    setSuggestions([]);
                  }}
                  type="button"
                >
                  <span className="font-medium text-[#1c133b]">{primary}</span>
                  {suggestion.properties.city || suggestion.properties.postcode ? (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {[suggestion.properties.city, suggestion.properties.postcode]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
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
