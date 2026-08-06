"use client";

import { CreditCard, LogOut, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AvatarUpload } from "@/components/shared/avatar-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFeedback } from "@/components/shared/feedback-provider";
import { SERVICES } from "@/lib/customer/services";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/auth";
import type {
  CleanerArea,
  CleanerAvailability,
  CleanerProfile,
  CleanerService,
} from "@/types/cleaner";

export function CleanerProfileForm({
  areas: initialAreas,
  availability: initialAvailability,
  cleaner: initialCleaner,
  profile: initialProfile,
  services: initialServices,
}: {
  areas: CleanerArea[];
  availability: CleanerAvailability[];
  cleaner: CleanerProfile;
  profile: Profile;
  services: CleanerService[];
}) {
  const router = useRouter();
  const { error: showError, success } = useFeedback();
  const [profile, setProfile] = useState(initialProfile);
  const [cleaner, setCleaner] = useState(initialCleaner);
  const [services, setServices] = useState(
    initialServices.map((service) => service.service_type),
  );
  const [areas, setAreas] = useState(
    initialAreas.map((area) => area.postcode_prefix ?? ""),
  );
  const [availability, setAvailability] = useState(initialAvailability);
  const [prefix, setPrefix] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function save() {
    setStatus("Saving…");
    const supabase = createBrowserClient();

    await Promise.all([
      supabase
        .from("profiles")
        .update({
          avatar_url: profile.avatar_url,
          full_name: profile.full_name,
          phone: profile.phone,
        })
        .eq("id", profile.id),
      supabase
        .from("cleaner_profiles")
        .update({
          bio: cleaner.bio,
          payout_preference: cleaner.payout_preference,
          working_radius_km: cleaner.working_radius_km,
          years_experience: cleaner.years_experience,
        })
        .eq("id", profile.id),
      supabase.from("cleaner_services").delete().eq("cleaner_id", profile.id),
      supabase
        .from("cleaner_working_areas")
        .delete()
        .eq("cleaner_id", profile.id),
      supabase
        .from("cleaner_availability")
        .delete()
        .eq("cleaner_id", profile.id),
    ]);

    await Promise.all([
      supabase.from("cleaner_services").insert(
        services.map((service_type) => ({
          cleaner_id: profile.id,
          service_type,
        })),
      ),
      supabase.from("cleaner_working_areas").insert(
        areas
          .map((area) => area.trim().toUpperCase())
          .filter(Boolean)
          .map((postcode_prefix) => ({
            cleaner_id: profile.id,
            postcode_prefix,
          })),
      ),
      supabase.from("cleaner_availability").insert(
        availability.map((day) => ({
          cleaner_id: profile.id,
          day_of_week: day.day_of_week,
          end_time: day.end_time,
          is_available: day.is_available,
          start_time: day.start_time,
        })),
      ),
    ]);

    setStatus(null);
    success({
      kind: "saved",
      title: "Profile saved",
      note: "Your availability and services are up to date.",
    });
    router.refresh();
  }

  async function connectStripe() {
    setStatus("Opening Stripe…");

    try {
      const response = await fetch(
        profile.stripe_account_id
          ? "/api/cleaner/stripe-dashboard"
          : "/api/cleaner/stripe-connect",
        { method: "POST" },
      );
      const result = (await parseJsonResponse(response)) as {
        error?: string;
        url?: string;
      };

      if (result.url) {
        window.location.assign(result.url);
        return;
      }

      const errorMessage = result.error ?? "Unable to open Stripe.";
      setStatus(errorMessage);
      showError({
        description: errorMessage,
        title: "Stripe didn’t open",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unable to open Stripe.";
      setStatus(errorMessage);
      showError({
        description: errorMessage,
        title: "Stripe didn’t open",
      });
    }
  }

  async function logout() {
    await createBrowserClient().auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_.8fr]">
      <section className="rounded-xl border bg-background p-6">
        <AvatarUpload
          currentUrl={profile.avatar_url}
          onUpload={(url) => {
            setProfile((current) => ({ ...current, avatar_url: url }));
            success({
              kind: "updated",
              title: "Look updated",
              note: "Your new avatar is live.",
            });
          }}
          userId={profile.id}
        />

        <div className="mt-5 space-y-4">
          <Field label="Full name">
            <Input
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  full_name: event.target.value,
                }))
              }
              value={profile.full_name}
            />
          </Field>
          <Field label="Phone">
            <Input
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
              value={profile.phone ?? ""}
            />
          </Field>
          <Field label="Bio">
            <textarea
              className="min-h-28 w-full rounded-md border p-3 text-sm"
              onChange={(event) =>
                setCleaner((current) => ({
                  ...current,
                  bio: event.target.value,
                }))
              }
              value={cleaner.bio ?? ""}
            />
          </Field>
          <Field label="Experience">
            <Input
              min={0}
              onChange={(event) =>
                setCleaner((current) => ({
                  ...current,
                  years_experience: Number(event.target.value),
                }))
              }
              type="number"
              value={cleaner.years_experience ?? 0}
            />
          </Field>
          <Field label="Payout preference">
            <select
              className="h-11 w-full rounded-md border px-3"
              onChange={(event) =>
                setCleaner((current) => ({
                  ...current,
                  payout_preference: event.target.value as "weekly" | "monthly",
                }))
              }
              value={cleaner.payout_preference}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </Field>
        </div>
      </section>

      <div className="space-y-5">
        <Panel title="Services">
          {SERVICES.map((service) => (
            <label className="flex gap-2 text-sm" key={service.value}>
              <input
                checked={services.includes(service.value)}
                onChange={(event) =>
                  setServices((current) =>
                    event.target.checked
                      ? [...current, service.value]
                      : current.filter((item) => item !== service.value),
                  )
                }
                type="checkbox"
              />
              {service.label}
            </label>
          ))}
        </Panel>

        <Panel title="Working areas">
          <div className="flex gap-2">
            <Input
              onChange={(event) => setPrefix(event.target.value.toUpperCase())}
              value={prefix}
            />
            <Button
              onClick={() => {
                const next = prefix.trim().toUpperCase();
                if (next) {
                  setAreas((current) => Array.from(new Set([...current, next])));
                }
                setPrefix("");
              }}
              size="icon"
            >
              <Plus />
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {areas.map((area) => (
              <button
                className="rounded-full bg-muted px-3 py-1 text-sm"
                key={area}
                onClick={() =>
                  setAreas((current) => current.filter((item) => item !== area))
                }
                type="button"
              >
                {area}
                <X className="ml-1 inline h-3 w-3" />
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Weekly availability">
          {availability.map((day, index) => (
            <label
              className="flex items-center justify-between text-sm"
              key={day.day_of_week}
            >
              <span>
                <input
                  checked={day.is_available}
                  className="mr-2"
                  onChange={(event) => {
                    const next = [...availability];
                    next[index] = { ...day, is_available: event.target.checked };
                    setAvailability(next);
                  }}
                  type="checkbox"
                />
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day.day_of_week]}
              </span>
              <span>
                {day.start_time.slice(0, 5)}–{day.end_time.slice(0, 5)}
              </span>
            </label>
          ))}
        </Panel>

        <Panel title="Document status">
          <p className="text-sm">
            DBS: <b className="capitalize">{cleaner.dbs_document_status}</b>
          </p>
          <p className="mt-2 text-sm">
            ID: <b className="capitalize">{cleaner.id_document_status}</b>
          </p>
        </Panel>

        <Panel title="Payout setup">
          <p className="text-sm">
            Stripe:{" "}
            <b>
              {cleaner.stripe_onboarding_complete
                ? "Ready for payouts"
                : profile.stripe_account_id
                  ? "Connected, setup incomplete"
                  : "Not connected"}
            </b>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            You can set this up after approval, but payouts cannot be sent until
            Stripe Express is complete.
          </p>
          <Button className="mt-3 w-full" onClick={() => void connectStripe()} variant="outline">
            <CreditCard className="mr-2 h-4 w-4" />
            {profile.stripe_account_id ? "Open Stripe Express" : "Connect Stripe Express"}
          </Button>
        </Panel>

        {status ? <p className="text-sm">{status}</p> : null}

        <Button className="w-full" onClick={() => void save()}>
          Save profile
        </Button>
        <Button className="w-full text-destructive" onClick={() => void logout()} variant="ghost">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>
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

function Panel({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="space-y-2 rounded-xl border bg-background p-5">
      <h2 className="mb-3 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

async function parseJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return {
    error:
      text ||
      `Request failed with status ${response.status}. Please try again.`,
  };
}
