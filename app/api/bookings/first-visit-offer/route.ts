import { NextResponse } from "next/server";

import { firstVisitOfferLeadAvailable } from "@/lib/bookings/redeem-first-visit-offer";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-client";

export async function GET(request: Request) {
  const { user } = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ eligible: false });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email, phone")
    .eq("id", user.id)
    .single();

  const eligible = await firstVisitOfferLeadAvailable({
    admin,
    customerId: user.id,
    email: profile?.email,
    phone: profile?.phone,
  });

  return NextResponse.json({
    eligible,
    freeHours: eligible ? 1 : 0,
  });
}
