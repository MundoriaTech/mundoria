import { AddressManager } from "@/components/customer/address-manager";
import { createServerClient } from "@/lib/supabase/server";
import type { Address } from "@/types/customer";

export const metadata = { title: "Saved addresses" };

export default async function CustomerAddressesPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("addresses")
    .select("*")
    .eq("customer_id", user!.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <AddressManager
      initialAddresses={(data ?? []) as Address[]}
      userId={user!.id}
    />
  );
}
