import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Admin sections that can be restricted per admin.
 * - meta_leads: the Meta 20%-off leads. Only admins granted it can see it.
 * - leads, callback_leads: every admin sees these unless blocked.
 */
export type AdminArea = "meta_leads" | "leads" | "callback_leads";

const GRANT_ONLY: AdminArea[] = ["meta_leads"];
const DEFAULT_OPEN: AdminArea[] = ["leads", "callback_leads"];

export type AdminAccess = Record<AdminArea, boolean>;

export async function adminAccessFor(email: string | null | undefined): Promise<AdminAccess> {
  const key = (email ?? "").trim().toLowerCase();
  let grants: string[] = [];
  let blocks: string[] = [];
  if (key) {
    const { data } = await createAdminClient()
      .from("admin_access_rules")
      .select("grants,blocks")
      .eq("email", key)
      .maybeSingle();
    grants = (data?.grants as string[] | null) ?? [];
    blocks = (data?.blocks as string[] | null) ?? [];
  }
  const access = {} as AdminAccess;
  for (const area of GRANT_ONLY) access[area] = grants.includes(area) && !blocks.includes(area);
  for (const area of DEFAULT_OPEN) access[area] = !blocks.includes(area);
  return access;
}

/** Admin ids allowed to see an area (for alerts about it). */
export async function adminIdsWithAccess(area: AdminArea) {
  const admin = createAdminClient();
  const [{ data: admins }, { data: rules }] = await Promise.all([
    admin.from("profiles").select("id,email").eq("role", "admin"),
    admin.from("admin_access_rules").select("email,grants,blocks"),
  ]);
  const byEmail = new Map(
    (rules ?? []).map((rule) => [String(rule.email), rule as { blocks: string[]; grants: string[] }]),
  );
  return (admins ?? [])
    .filter((row) => {
      const rule = byEmail.get(String(row.email ?? "").toLowerCase());
      if (rule?.blocks?.includes(area)) return false;
      if (GRANT_ONLY.includes(area)) return Boolean(rule?.grants?.includes(area));
      return true;
    })
    .map((row) => row.id as string);
}

/** Leads from the 20%-off (Meta) page need meta_leads; other leads need leads. */
export function canSeeLeadSource(access: AdminAccess, source: string | null | undefined) {
  return String(source ?? "") === "meta-20-off" ? access.meta_leads : access.leads;
}
