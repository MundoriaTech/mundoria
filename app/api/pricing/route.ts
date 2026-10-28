import { NextResponse } from "next/server";

import { loadServicePricing } from "@/lib/customer/pricing-config";

/** Public rate card for booking estimates (admin overrides included). */
export async function GET() {
  const pricing = await loadServicePricing();
  return NextResponse.json(
    { pricing },
    {
      headers: {
        "Cache-Control": "public, max-age=15, stale-while-revalidate=60",
      },
    },
  );
}
