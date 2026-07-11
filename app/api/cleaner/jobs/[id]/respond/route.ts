import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";

const schema=z.object({response:z.enum(["accepted","declined"])});
export async function POST(request:Request,{params}:{params:{id:string}}){
  const parsed=schema.safeParse(await request.json());
  if(!parsed.success) return NextResponse.json({error:"Invalid response"},{status:400});
  const supabase=createRouteHandlerClient({cookies});
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const admin=createAdminClient();
  if(parsed.data.response==="accepted"){
    const {data:booking}=await admin.from("bookings").update({cleaner_id:user.id,status:"confirmed"}).eq("id",params.id).in("status",["pending_match","matched"]).or(`cleaner_id.is.null,cleaner_id.eq.${user.id}`).select().maybeSingle();
    if(!booking) return NextResponse.json({error:"This job is no longer available."},{status:409});
    await admin.from("matching_decisions").insert({
      booking_id: params.id,
      cleaner_id: user.id,
      decision: "offer_accepted",
      reasons: { source: "cleaner_job_feed" },
    });
  }
  await admin.from("cleaner_job_responses").upsert({
    booking_id:params.id,cleaner_id:user.id,response:parsed.data.response,responded_at:new Date().toISOString()
  },{onConflict:"booking_id,cleaner_id"});
  if(parsed.data.response==="declined"){
    const {data:cp}=await admin.from("cleaner_profiles").select("acceptance_rate").eq("id",user.id).single();
    await admin.from("cleaner_profiles").update({acceptance_rate:Math.max(0,Number(cp?.acceptance_rate ?? 100)-2)}).eq("id",user.id);
  }
  return NextResponse.json({success:true});
}
