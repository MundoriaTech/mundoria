import { ZonesManager } from "@/components/admin/zones-manager";
import { createAdminClient } from "@/lib/supabase/admin";
export default async function AdminZonesPage(){const {data}=await createAdminClient().from("zones").select("*").order("created_at",{ascending:false});return <div><h1 className="text-3xl font-semibold">Service zones</h1><p className="mt-2 mb-7 text-muted-foreground">Control postcode coverage and launches.</p><ZonesManager zones={data??[]}/></div>}
