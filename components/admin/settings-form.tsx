"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Settings {
  cancellation_window_hours: number;
  geofence_radius_meters: number;
  platform_commission_percent: number;
  support_email: string | null;
}

export function SettingsForm({ initial }: { initial: Settings }) {
  const [settings, setSettings] = useState(initial);
  const [message, setMessage] = useState("");
  async function save() {
    const response = await fetch("/api/admin/settings", {
      body: JSON.stringify(settings),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { error?: string };
    setMessage(response.ok ? "Settings saved." : result.error ?? "Save failed.");
  }
  return <section className="max-w-2xl rounded-xl border bg-card p-6"><div className="grid gap-5 sm:grid-cols-2"><Field label="Platform commission (%)"><Input min={0} max={100} type="number" value={settings.platform_commission_percent} onChange={(event) => setSettings({ ...settings, platform_commission_percent: Number(event.target.value) })} /></Field><Field label="Geofence radius (metres)"><Input min={50} type="number" value={settings.geofence_radius_meters} onChange={(event) => setSettings({ ...settings, geofence_radius_meters: Number(event.target.value) })} /></Field><Field label="Cancellation window (hours)"><Input min={0} type="number" value={settings.cancellation_window_hours} onChange={(event) => setSettings({ ...settings, cancellation_window_hours: Number(event.target.value) })} /></Field><Field label="Support email"><Input type="email" value={settings.support_email ?? ""} onChange={(event) => setSettings({ ...settings, support_email: event.target.value || null })} /></Field></div><Button className="mt-6" onClick={() => void save()}>Save settings</Button>{message ? <p className="mt-3 text-sm">{message}</p> : null}</section>;
}
function Field({children,label}:{children:React.ReactNode;label:string}){return <label className="space-y-2 text-sm font-medium"><span>{label}</span>{children}</label>}
