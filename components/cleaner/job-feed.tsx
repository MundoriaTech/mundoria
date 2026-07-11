"use client";

import { AlertTriangle, Clock3, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney, formatServiceName } from "@/lib/customer/services";
import type { CleanerJob } from "@/types/cleaner";

export function JobFeed({ available, assigned }: { available: CleanerJob[]; assigned: CleanerJob[] }) {
 const router=useRouter(); const [tab,setTab]=useState<"available"|"upcoming"|"past">("available"); const [now,setNow]=useState(Date.now()); const [warning,setWarning]=useState(false);
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer)},[]);
 const jobs=tab==="available"?available:assigned.filter((job)=>tab==="past"?["completed","cancelled"].includes(job.status):!["completed","cancelled"].includes(job.status));
 async function respond(id:string,response:"accepted"|"declined"){const res=await fetch(`/api/cleaner/jobs/${id}/respond`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({response})});if(res.ok){if(response==="accepted")router.push(`/cleaner/job/${id}`);else{setWarning(true);router.refresh();}}}
 return <div>
  <div className="mb-6 inline-flex rounded-lg bg-muted p-1">{(["available","upcoming","past"] as const).map((item)=><Button key={item} onClick={()=>setTab(item)} size="sm" variant={tab===item?"default":"ghost"} className="capitalize">{item}</Button>)}</div>
  {warning?<div className="mb-4 flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"><AlertTriangle className="h-5 w-5"/>Repeated declines affect your reliability score.</div>:null}
  <div className="grid gap-4 lg:grid-cols-2">{jobs.map((job)=>{
   const expires=new Date(job.created_at).getTime()+30*60*1000;const remaining=Math.max(0,expires-now);const borough=job.address?.city??job.address?.postcode?.split(" ")[0]??"Local area";
   return <article className="rounded-xl border bg-background p-5 shadow-sm" key={job.id}>
    <div className="flex justify-between gap-3"><div><h2 className="font-semibold">{formatServiceName(job.service_type)}</h2><p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4"/>{tab==="available"?borough:`${job.address?.address_line_1}, ${borough}`}</p></div><b className="text-primary">{formatMoney(job.amount_cleaner)}</b></div>
    <div className="mt-4 flex items-center justify-between text-sm"><span>{job.scheduled_date} · {job.scheduled_start_time.slice(0,5)}</span>{tab==="available"?<span className="flex items-center gap-1 text-amber-700"><Clock3 className="h-4 w-4"/>{Math.floor(remaining/60000)}:{String(Math.floor((remaining%60000)/1000)).padStart(2,"0")}</span>:<span className="capitalize">{job.status.replaceAll("_"," ")}</span>}</div>
    <div className="mt-4 flex justify-end gap-2">{tab==="available"?<><Button onClick={()=>void respond(job.id,"declined")} variant="ghost">Decline</Button><Button disabled={remaining===0} onClick={()=>void respond(job.id,"accepted")}>Accept</Button></>:<Button onClick={()=>router.push(`/cleaner/job/${job.id}`)} variant="outline">View job</Button>}</div>
   </article>
  })}</div>
  {!jobs.length?<div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">No {tab} jobs right now.</div>:null}
 </div>
}
