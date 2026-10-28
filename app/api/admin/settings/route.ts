import { NextResponse } from "next/server";
import { z } from "zod";

import { logAdminAction, requireAdmin } from "@/lib/admin/auth";
import {
  clearServicePricingCache,
  normalizeServicePricing,
} from "@/lib/customer/pricing-config";

const schema = z.object({
  cancellation_window_hours: z.number().int().min(0).max(72),
  geofence_radius_meters: z.number().int().min(50).max(5000),
  payment_capture_hour_uk: z.number().int().min(0).max(23),
  payment_capture_minute_uk: z.number().int().min(0).max(59),
  payment_preauth_hours_before: z.number().int().min(1).max(168),
  platform_commission_percent: z.number().min(0).max(100),
  service_pricing: z.unknown().optional(),
  support_email: z.string().email().nullable(),
});

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
  }

  const servicePricing =
    parsed.data.service_pricing !== undefined
      ? normalizeServicePricing(parsed.data.service_pricing)
      : undefined;

  const { service_pricing: _ignored, ...platformFields } = parsed.data;
  const { error } = await auth.admin
    .from("platform_settings")
    .update({
      ...platformFields,
      ...(servicePricing ? { service_pricing: servicePricing } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  clearServicePricingCache();

  await logAdminAction({
    action: "update_platform_settings",
    adminId: auth.user.id,
    entityType: "settings",
    metadata: {
      ...platformFields,
      service_pricing_updated: Boolean(servicePricing),
    },
    reason: "Platform settings update",
  });
  return NextResponse.json({ success: true });
}
