"use client";

import { CircleF, GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  async function save(payload: Record<string, unknown>) {
    const response = await fetch("/api/admin/zones", {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    if (response.ok) router.refresh();
  }
  return <div className="grid gap-6 xl:grid-cols-[.7fr_1.3fr]"><div className="space-y-4"><section className="rounded-xl border bg-white p-5"><h2 className="font-semibold">Add zone</h2><Input className="mt-4" onChange={(event) => setName(event.target.value)} placeholder="South West London" /><Input className="mt-3" onChange={(event) => setPrefixes(event.target.value)} placeholder="SW1, SW2, SW3" /><Button className="mt-3" disabled={!name || !prefixes} onClick={() => void save({action:"create",name,postcode_prefixes:prefixes.split(",").map(item=>item.trim()).filter(Boolean)})}><Plus className="mr-2 h-4 w-4"/>Add zone</Button></section>{zones.map(zone=><article className="rounded-xl border bg-white p-4" key={zone.id}><div className="flex justify-between gap-3"><div><b>{zone.name}</b><p className="mt-1 text-sm text-muted-foreground">{zone.postcode_prefixes.join(", ")}</p></div><Button onClick={() => void save({action:"toggle",id:zone.id,is_active:!zone.is_active})} size="sm" variant={zone.is_active?"default":"outline"}>{zone.is_active?"Active":"Inactive"}</Button></div></article>)}</div><ZoneMap zones={zones}/></div>;
}

function ZoneMap({ zones }: { zones: Zone[] }) {
  const key=process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY??"";
  if(!key)return <div className="flex h-[32rem] items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">Configure Google Maps for zone coverage preview.</div>;
  return <LoadedZoneMap apiKey={key} zones={zones}/>;
}
function LoadedZoneMap({apiKey,zones}:{apiKey:string;zones:Zone[]}){const {isLoaded}=useJsApiLoader({googleMapsApiKey:apiKey,id:"cleanscape-google-maps",libraries:["places"]});if(!isLoaded)return <div className="h-[32rem] rounded-xl bg-muted"/>;const center={lat:51.5074,lng:-.1278};return <GoogleMap center={center} mapContainerClassName="h-[32rem] rounded-xl" zoom={10}>{zones.filter(z=>z.is_active).map((zone,index)=><CircleF center={{lat:center.lat+(index%3)*.035,lng:center.lng+(index%4)*.045}} key={zone.id} options={{fillColor:"#059669",fillOpacity:.14,strokeColor:"#059669"}} radius={5000+zone.postcode_prefixes.length*1000}/>)}</GoogleMap>}
