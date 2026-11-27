import { NextResponse } from "next/server";
import { z } from "zod";

import { logAdminAction, requireAdmin } from "@/lib/admin/auth";
import {
  ADDRESS_NEEDS_STREET_MESSAGE,
  addressHasStreet,
  composeStreetLine,
} from "@/lib/customer/address-completeness";
import { geocodeAddress } from "@/lib/geo/geocode";

const schema = z.object({
  bathrooms: z.number().int().min(0).max(20).optional(),
  bedrooms: z.number().int().min(0).max(20).optional(),
  city: z.string().trim().min(1, "Enter the town or city.").max(80),
  house: z.string().trim().min(1, "Enter the house number or name.").max(80),
  otherRooms: z.number().int().min(0).max(20).optional(),
  postcode: z.string().trim().min(5, "Enter the postcode.").max(10),
  street: z.string().trim().min(1, "Enter the street.").max(120),
});

/**
 * Save a new address on a customer's account, so an admin can move a booking
 * there (with Edit booking). The customer sees it in their saved addresses.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the address and try again." },
      { status: 400 },
    );
  }
  const input = parsed.data;

  const { data: customer } = await auth.admin
    .from("profiles")
    .select("id,role")
    .eq("id", params.id)
    .maybeSingle();
  if (!customer || customer.role !== "customer") {
    return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  }

  const postcode = input.postcode.toUpperCase().replace(/\s+/g, " ").trim();
  const line1 = [composeStreetLine(input.house, input.street), input.city, postcode].join(", ");
  if (!addressHasStreet({ address_line_1: line1, city: input.city, postcode })) {
    return NextResponse.json({ error: ADDRESS_NEEDS_STREET_MESSAGE }, { status: 400 });
  }
  const point = await geocodeAddress(line1);

  const { data: address, error } = await auth.admin
    .from("addresses")
    .insert({
      address_line_1: line1,
      address_line_2: null,
      city: input.city,
      customer_id: params.id,
      is_default: false,
      latitude: point?.lat ?? null,
      longitude: point?.lon ?? null,
      num_bathrooms: input.bathrooms ?? null,
      num_bedrooms: input.bedrooms ?? null,
      num_other_rooms: input.otherRooms ?? null,
      postcode,
    })
    .select("id,address_line_1,postcode")
    .single();
  if (error || !address) {
    return NextResponse.json({ error: error?.message ?? "Couldn't save the address." }, { status: 400 });
  }

  await logAdminAction({
    action: "add_customer_address",
    adminId: auth.user.id,
    entityId: params.id,
    entityType: "customer",
    metadata: { addressId: address.id, postcode },
    reason: "Added to move a booking",
  });
  return NextResponse.json({
    address: { id: address.id, label: [address.address_line_1, address.postcode].filter(Boolean).join(", ") },
  });
}
