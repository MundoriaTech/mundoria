import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";

const addressBodySchema = z.object({
  address_line_1: z.string().trim().min(1, "Address line is required."),
  address_line_2: z.string().trim().optional().nullable(),
  city: z.string().trim().min(1, "City is required."),
  id: z.string().uuid().optional(),
  is_default: z.boolean().optional().default(false),
  label: z.string().trim().optional().nullable(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  num_bathrooms: z.number().int().min(0).optional().nullable(),
  num_bedrooms: z.number().int().min(0).optional().nullable(),
  postcode: z.string().trim().min(1, "Postcode is required."),
  property_type: z.enum(["house", "flat", "office", "other"]).nullable().optional(),
  special_requirements: z.string().trim().optional().nullable(),
});

export async function POST(request: Request) {
  return saveAddress(request, "create");
}

export async function PATCH(request: Request) {
  return saveAddress(request, "update");
}

async function saveAddress(request: Request, mode: "create" | "update") {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please log in again to save your address." },
      { status: 401 },
    );
  }

  const parsed = addressBodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid address details." },
      { status: 400 },
    );
  }

  if (mode === "update" && !parsed.data.id) {
    return NextResponse.json(
      { error: "Address id is required to update." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  if (!profile) {
    return NextResponse.json(
      { error: "Your account profile is incomplete. Please sign out and create an account again." },
      { status: 400 },
    );
  }

  if (profile.role === "admin") {
    return NextResponse.json(
      { error: "Admin accounts cannot save customer addresses. Use a customer account to book." },
      { status: 403 },
    );
  }

  // Cleaners can still book for themselves; ensure address ownership is their user id.
  if (profile.role !== "customer" && profile.role !== "cleaner") {
    return NextResponse.json(
      { error: "Only customer accounts can save booking addresses." },
      { status: 403 },
    );
  }

  const payload = {
    address_line_1: parsed.data.address_line_1,
    address_line_2: parsed.data.address_line_2?.trim() || null,
    city: parsed.data.city,
    customer_id: user.id,
    is_default: parsed.data.is_default ?? false,
    label: parsed.data.label?.trim() || null,
    latitude: parsed.data.latitude ?? null,
    longitude: parsed.data.longitude ?? null,
    num_bathrooms: parsed.data.num_bathrooms ?? null,
    num_bedrooms: parsed.data.num_bedrooms ?? null,
    postcode: parsed.data.postcode.toUpperCase(),
    property_type: parsed.data.property_type ?? null,
    special_requirements: parsed.data.special_requirements?.trim() || null,
  };

  if (payload.is_default) {
    let clearQuery = admin
      .from("addresses")
      .update({ is_default: false })
      .eq("customer_id", user.id);

    if (parsed.data.id) {
      clearQuery = clearQuery.neq("id", parsed.data.id);
    }

    const { error: clearError } = await clearQuery;
    if (clearError) {
      return NextResponse.json({ error: clearError.message }, { status: 400 });
    }
  }

  const query =
    mode === "update" && parsed.data.id
      ? admin
          .from("addresses")
          .update(payload)
          .eq("id", parsed.data.id)
          .eq("customer_id", user.id)
          .select("*")
          .single()
      : admin.from("addresses").insert(payload).select("*").single();

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ address: data });
}
