import { NextResponse } from "next/server";

import {
  firstVisitOfferLeadAvailable,
  resolvePercentOffer,
} from "@/lib/bookings/redeem-first-visit-offer";
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

  // 20% off the first clean (Meta page) takes the place of the free hour.
  const percentOffer = await resolvePercentOffer({
    admin,
    customerId: user.id,
    email: profile?.email,
    phone: profile?.phone,
  });
  const eligible = percentOffer
    ? false
    : await firstVisitOfferLeadAvailable({
        admin,
        customerId: user.id,
        email: profile?.email,
        phone: profile?.phone,
      });

  return NextResponse.json({
    eligible,
    freeHours: eligible ? 1 : 0,
    percentOff: percentOffer?.percent ?? 0,
  });
}
