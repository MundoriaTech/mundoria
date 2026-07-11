import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/auth";
import { handleNoShow } from "@/lib/bookings/no-show";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    return NextResponse.json(await handleNoShow(params.id));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No-show handling failed" },
      { status: 400 },
    );
  }
}
