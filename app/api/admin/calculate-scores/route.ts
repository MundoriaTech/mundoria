import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/auth";
import { calculateCleanerScores } from "@/lib/scoring/engine";

export async function POST() {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ results: await calculateCleanerScores() });
}
