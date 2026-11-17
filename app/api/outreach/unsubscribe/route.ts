import { NextResponse } from "next/server";

import { appUrl } from "@/lib/outreach/config";
import { optOutLead, LEAD_COLUMNS, type LeadRow } from "@/lib/outreach/leads";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * One-click unsubscribe (RFC 8058). Mail clients POST here from the
 * List-Unsubscribe header; the /unsubscribe page's button posts here too.
 * GET never unsubscribes (link scanners pre-fetch URLs); it shows the page.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  let token = url.searchParams.get("token") ?? "";
  if (!token && request.headers.get("content-type")?.includes("form")) {
    const form = await request.formData();
    token = String(form.get("token") ?? "");
  }
  const lead = await leadByToken(token);
  if (lead && !lead.do_not_contact) {
    await optOutLead(lead, "all", "Unsubscribed by link");
  }
  // Form posts get the confirmation page; mail clients just need a 2xx.
  if (request.headers.get("content-type")?.includes("form")) {
    return NextResponse.redirect(`${appUrl()}/unsubscribe?done=1`, { status: 303 });
  }
  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  return NextResponse.redirect(`${appUrl()}/unsubscribe?token=${encodeURIComponent(token)}`);
}

async function leadByToken(token: string) {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return null;
  const { data } = await createAdminClient()
    .from("leads")
    .select(LEAD_COLUMNS)
    .eq("unsubscribe_token", token)
    .maybeSingle();
  return (data as LeadRow | null) ?? null;
}
