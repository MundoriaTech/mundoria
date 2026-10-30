import { createAdminClient } from "@/lib/supabase/admin";

export type AdminUserCounts = {
  admins: number;
  cleaners: number;
  customers: number;
  total: number;
};

/** Exact profile counts by role for the admin portal. */
export async function loadAdminUserCounts(): Promise<AdminUserCounts> {
  const admin = createAdminClient();
  const [customers, cleaners, admins] = await Promise.all([
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "customer"),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "cleaner"),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin"),
  ]);

  const customerCount = customers.count ?? 0;
  const cleanerCount = cleaners.count ?? 0;
  const adminCount = admins.count ?? 0;

  return {
    admins: adminCount,
    cleaners: cleanerCount,
    customers: customerCount,
    total: customerCount + cleanerCount + adminCount,
  };
}
