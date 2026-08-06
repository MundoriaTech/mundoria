"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { GeoapifyMapView } from "@/components/shared/geoapify-map-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LONDON_CENTER } from "@/lib/maps/geoapify";

interface Zone {
  id: string;
  name: string;
  postcode_prefixes: string[];
  is_active: boolean;
  launch_date: string | null;
}

export function ZonesManager({ zones }: { zones: Zone[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [prefixes, setPrefixes] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function save(payload: Record<string, unknown>) {
    setError(null);
    const response = await fetch("/api/admin/zones", {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    if (!response.ok) {
      setError(result.error ?? "Could not save zone.");
      return;
    }
    if (payload.action === "create") {
      setName("");
      setPrefixes("");
    }
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[.7fr_1.3fr]">
      <div className="space-y-4">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Add zone</h2>
          {error ? (
            <p className="mt-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Input
            className="mt-4"
            onChange={(event) => setName(event.target.value)}
            placeholder="South West London"
            value={name}
          />
          <Input
            className="mt-3"
            onChange={(event) => setPrefixes(event.target.value)}
            placeholder="SW1, SW2, SW3"
            value={prefixes}
          />
          <Button
            className="mt-3"
            disabled={!name || !prefixes}
            onClick={() =>
              void save({
                action: "create",
                name,
                postcode_prefixes: prefixes
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add zone
          </Button>
        </section>
        {zones.map((zone) => (
          <article className="rounded-xl border bg-card p-4" key={zone.id}>
            <div className="flex justify-between gap-3">
              <div>
                <b>{zone.name}</b>
                <p className="mt-1 text-sm text-muted-foreground">
                  {zone.postcode_prefixes.join(", ")}
                </p>
              </div>
              <Button
                onClick={() =>
                  void save({
                    action: "toggle",
                    id: zone.id,
                    is_active: !zone.is_active,
                  })
                }
                size="sm"
                variant={zone.is_active ? "default" : "outline"}
              >
                {zone.is_active ? "Active" : "Inactive"}
              </Button>
            </div>
          </article>
        ))}
      </div>
      <ZoneMap zones={zones} />
    </div>
  );
}

function ZoneMap({ zones }: { zones: Zone[] }) {
  const activeZones = zones.filter((zone) => zone.is_active);

  return (
    <div className="space-y-3">
      <GeoapifyMapView
        center={LONDON_CENTER}
        circles={activeZones.map((zone, index) => ({
          center: {
            // Approximate spread for overview only — prefixes are not geocoded.
            lat: LONDON_CENTER.lat + (index % 3) * 0.035,
            lng: LONDON_CENTER.lng + (index % 4) * 0.045,
          },
          color: "#059669",
          id: zone.id,
          radiusMeters: 5000 + zone.postcode_prefixes.length * 1000,
        }))}
        className="h-[32rem]"
        markers={[]}
        zoom={10}
      />
      <p className="text-xs text-muted-foreground">
        Map markers are an approximate overview of active zones, not exact
        postcode boundaries. Zone membership is based on postcode prefixes:{" "}
        {activeZones.length
          ? activeZones.map((zone) => zone.name).join(", ")
          : "none active"}
        .
      </p>
    </div>
  );
}
