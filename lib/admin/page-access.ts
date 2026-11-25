import { notFound } from "next/navigation";

import { adminAccessFor, type AdminAccess, type AdminArea } from "@/lib/admin/access";
import { createServerClient } from "@/lib/supabase/server";

/** Access for the signed-in admin (server components). */
export async function currentAdminAccess(): Promise<AdminAccess> {
  const {
    data: { user },
  } = await createServerClient().auth.getUser();
  return adminAccessFor(user?.email);
}

/** 404 unless the signed-in admin may see this section. */
export async function requireAdminArea(area: AdminArea) {
  const access = await currentAdminAccess();
  if (!access[area]) notFound();
  return access;
}
