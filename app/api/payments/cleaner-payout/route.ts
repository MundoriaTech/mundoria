import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin/auth";
import { processCleanerPayout } from "@/lib/payments/service";

const schema = z.object({ payout_id: z.string().uuid() });

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "payout_id required" }, { status: 400 });
  try {
    const transfer = await processCleanerPayout(parsed.data.payout_id);
    return NextResponse.json({ stripe_transfer_id: transfer.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payout failed" },
      { status: 400 },
    );
  }
}
