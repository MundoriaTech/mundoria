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
  <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
    {(["available","upcoming","past"] as const).map((item)=>(
      <Button key={item} onClick={()=>setTab(item)} size="sm" variant={tab===item?"default":"ghost"} className="min-h-11 min-w-[5.5rem] flex-1 capitalize sm:min-w-0">{item}</Button>
    ))}
  </div>
  {warning?<div className="mb-4 flex gap-2 rounded-lg border border-border bg-muted p-3 text-sm text-foreground"><AlertTriangle className="h-5 w-5 shrink-0 text-amber-600"/>Repeated declines affect your reliability score.</div>:null}
  <div className="grid gap-4 lg:grid-cols-2">{jobs.map((job)=>{
   const expires=new Date(job.created_at).getTime()+30*60*1000;const remaining=Math.max(0,expires-now);const borough=job.address?.city??job.address?.postcode?.split(" ")[0]??"Local area";
   return <article className="rounded-xl border bg-background p-5 shadow-sm" key={job.id}>
    <div className="flex justify-between gap-3"><div className="min-w-0"><h2 className="break-words font-semibold">{formatServiceName(job.service_type)}</h2><p className="mt-1 flex min-w-0 items-start gap-1 text-sm text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0"/><span className="min-w-0 break-words">{tab==="available"?borough:`${job.address?.address_line_1}, ${borough}`}</span></p></div><b className="shrink-0 text-primary">{formatMoney(job.amount_cleaner)}</b></div>
    <div className="mt-4 flex flex-col gap-2 text-sm min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between"><span>{job.scheduled_date} · {job.scheduled_start_time.slice(0,5)}</span>{tab==="available"?<span className="flex items-center gap-1 text-amber-700 dark:text-amber-400"><Clock3 className="h-4 w-4"/>{Math.floor(remaining/60000)}:{String(Math.floor((remaining%60000)/1000)).padStart(2,"0")}</span>:<span className="capitalize">{job.status.replaceAll("_"," ")}</span>}</div>
    <div className="mt-4 flex flex-col-reverse gap-2 min-[380px]:flex-row min-[380px]:justify-end">{tab==="available"?<><Button className="min-h-11 w-full min-[380px]:w-auto" onClick={()=>void respond(job.id,"declined")} variant="ghost">Decline</Button><Button className="min-h-11 w-full min-[380px]:w-auto" disabled={remaining===0} onClick={()=>void respond(job.id,"accepted")}>Accept</Button></>:<Button className="min-h-11 w-full min-[380px]:w-auto" onClick={()=>router.push(`/cleaner/job/${job.id}`)} variant="outline">View job</Button>}</div>
   </article>
  })}</div>
  {!jobs.length?<div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">No {tab} jobs right now.</div>:null}
 </div>
}
