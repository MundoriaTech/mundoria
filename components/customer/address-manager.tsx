"use client";

import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ActionError } from "@/components/shared/action-error";
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
      const stillBooked =
        error.code === "23503" || /foreign key constraint/i.test(error.message);
      showError({
        description: stillBooked
          ? "This place is still on a booking. Refresh the page and delete it again."
          : error.message,
        onRetry: () => void removeAddress(address),
        title: "Couldn’t delete this address",
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
    <div className="space-y-8 pb-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c79c66]">
            Places
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#1c133b] sm:text-[2rem]">
            Saved addresses
          </h1>
          <p className="mt-2 max-w-md text-sm font-light leading-6 text-[#5c5670]">
            Keep a home, office, or family address ready for the next booking.
          </p>
        </div>
        <button
          className="inline-flex h-11 items-center justify-center rounded-full bg-[#1c133b] px-5 text-sm font-semibold text-white transition hover:bg-[#312c79]"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          type="button"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add address
        </button>
      </div>

      {showForm || editing ? (
        <div className="rounded-[1.75rem] border border-[#e6e0f2] bg-white p-5 shadow-[0_16px_40px_rgba(28,19,59,0.06)] sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c79c66]">
                {editing ? "Edit" : "New"}
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#1c133b]">
                {editing ? (editing.label ?? "Address") : "Add a place"}
              </h2>
            </div>
            <button
              aria-label="Close address form"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#5c5670] transition hover:bg-[#f7f3ff] hover:text-[#1c133b]"
              onClick={() => {
                setEditing(null);
                setShowForm(false);
              }}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <AddressForm
            address={editing}
            onSaved={handleSaved}
            userId={userId}
          />
        </div>
      ) : null}

      {addresses.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <article
              className="flex flex-col overflow-hidden rounded-[1.75rem] border border-[#e6e0f2] bg-white shadow-[0_16px_40px_rgba(28,19,59,0.06)]"
              key={address.id}
            >
              <div className="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c79c66]">
                    {address.is_default ? "Default" : "Saved place"}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#1c133b]">
                    {address.label ?? "Address"}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[#5c5670]">
                    {address.address_line_1}
                    {address.address_line_2 ? `, ${address.address_line_2}` : ""}
                    <br />
                    {address.city}, {address.postcode}
                  </p>
                </div>
                <div className="flex shrink-0">
                  <button
                    aria-label="Edit address"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#312c79] transition hover:bg-[#f7f3ff]"
                    onClick={() => {
                      setEditing(address);
                      setShowForm(false);
                    }}
                    type="button"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    aria-label="Delete address"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#9a3412] transition hover:bg-[#fff4ee]"
                    onClick={() => void removeAddress(address)}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <dl className="mt-5 grid grid-cols-3 gap-px border-t border-[#efe6ff] bg-[#efe6ff]">
                <AddressFact label="Type" value={propertyLabel(address.property_type)} />
                <AddressFact label="Beds" value={String(address.num_bedrooms ?? 0)} />
                <AddressFact label="Baths" value={String(address.num_bathrooms ?? 0)} />
              </dl>
              {(address.num_other_rooms ?? 0) > 0 || address.special_requirements ? (
                <p className="px-5 py-4 text-sm leading-6 text-[#5c5670] sm:px-6">
                  {(address.num_other_rooms ?? 0) > 0
                    ? `${address.num_other_rooms} other room${address.num_other_rooms === 1 ? "" : "s"}.`
                    : ""}
                  {address.special_requirements
                    ? `${(address.num_other_rooms ?? 0) > 0 ? " " : ""}${address.special_requirements}`
                    : ""}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.75rem] bg-[#f3efe6] px-6 py-12 text-center shadow-[0_12px_28px_rgba(28,19,59,0.05)]">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#c79c66]">
            Places
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#1c133b]">
            No saved addresses
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm font-light leading-6 text-[#3d3a48]">
            Add a home or office and it will be ready the next time you book.
          </p>
        </div>
      )}
    </div>
  );
}

function AddressFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-4 py-3.5 sm:px-5">
      <dt className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#823fb2]">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold tracking-tight text-[#1c133b]">
        {value}
      </dd>
    </div>
  );
}

function propertyLabel(type: Address["property_type"]) {
  if (type === "house") return "House";
  if (type === "flat") return "Flat";
  if (type === "office") return "Office";
  if (type === "other") return "Other";
  return "Property";
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
        <ActionError message={error} title="Couldn’t save this address" />
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

      <AddressTagField
        onChange={(label) => update("label", label)}
        value={values.label}
      />

      {showAccountExtras ? (
        <>
      <label className="flex items-center gap-3 text-sm text-[#1c133b]">
        <input
          checked={values.is_default}
          className="h-4 w-4 accent-[#312c79]"
          onChange={(event) => update("is_default", event.target.checked)}
          type="checkbox"
        />
        Make this my default address
      </label>
          <Button className="h-11 rounded-full bg-[#1c133b] px-5 font-semibold text-white hover:bg-[#312c79]" disabled={saving} type="submit">
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

const ADDRESS_TAGS = ["Home", "Work", "Mum's home", "Dad's home"] as const;

function AddressTagField({
  onChange,
  value,
}: {
  onChange: (label: string) => void;
  value: string;
}) {
  const preset = ADDRESS_TAGS.includes(value as (typeof ADDRESS_TAGS)[number]);
  const [custom, setCustom] = useState(!preset && value.length > 0);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Address tag</p>
      <div className="flex flex-wrap gap-2">
        {ADDRESS_TAGS.map((tag) => (
          <button
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
              value === tag
                ? "border-[#6a45b8] bg-[#6a45b8] text-white"
                : "border-[#d9ccef] bg-white text-[#1c133b]"
            }`}
            key={tag}
            onClick={() => {
              setCustom(false);
              onChange(tag);
            }}
            type="button"
          >
            {tag}
          </button>
        ))}
        <button
          className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
            custom
              ? "border-[#6a45b8] bg-[#6a45b8] text-white"
              : "border-[#d9ccef] bg-white text-[#1c133b]"
          }`}
          onClick={() => {
            setCustom(true);
            if (preset) onChange("");
          }}
          type="button"
        >
          Other
        </button>
      </div>
      {custom ? (
        <Input
          onChange={(event) => onChange(event.target.value)}
          placeholder="Dad's home"
          value={value}
        />
      ) : null}
    </div>
  );
}
