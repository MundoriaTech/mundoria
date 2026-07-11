import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const schema=z.object({latitude:z.number().min(-90).max(90),longitude:z.number().min(-180).max(180)});
export async function POST(request:Request,{params}:{params:{id:string}}){
 const parsed=schema.safeParse(await request.json()); if(!parsed.success)return NextResponse.json({error:"Invalid location"},{status:400});
 const s=createRouteHandlerClient({cookies}); const {data:{user}}=await s.auth.getUser(); if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const {error}=await createAdminClient().from("bookings").update({cleaner_live_latitude:parsed.data.latitude,cleaner_live_longitude:parsed.data.longitude,cleaner_location_updated_at:new Date().toISOString()}).eq("id",params.id).eq("cleaner_id",user.id);
 return error?NextResponse.json({error:error.message},{status:400}):NextResponse.json({success:true});
}
