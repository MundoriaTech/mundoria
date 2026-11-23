import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { syncCleanerToRecruit } from "@/lib/zoho/recruit-sync";

/** Operations-only retry for a single cleaner; no public webhook or applicant-controlled mapping. */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!z.string().uuid().safeParse(params.id).success) return NextResponse.json({ error: "Invalid cleaner ID" }, { status: 400 });
  const result = await syncCleanerToRecruit(auth.admin, params.id);
  return NextResponse.json(result, { status: result.status === "failed" ? 502 : 200 });
}
