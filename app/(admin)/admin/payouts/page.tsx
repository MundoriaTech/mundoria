import { ProcessPayoutsButton } from "@/components/admin/process-payouts-button";
import {
  PayoutsTable,
  type AdminPayoutRow,
} from "@/components/admin/payouts-table";
import { formatMoney } from "@/lib/customer/services";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminPayoutsPage() {
  const { data } = await createAdminClient()
    .from("payouts")
    .select("*,cleaner:profiles!payouts_cleaner_id_fkey(full_name)")
    .order("created_at", { ascending: false });
  const payouts = (data ?? []) as AdminPayoutRow[];
  const now = new Date();
  const week = payouts
    .filter(
      (item) =>
        item.status === "pending" &&
        Date.now() - new Date(item.created_at).getTime() < 7 * 864e5,
    )
    .reduce((sum, item) => sum + item.net_amount, 0);
  const month = payouts
    .filter((item) => {
      const created = new Date(item.created_at);
      return (
        created.getFullYear() === now.getFullYear() &&
        created.getMonth() === now.getMonth()
      );
    })
    .reduce((sum, item) => sum + item.net_amount, 0);

  return (
    <div className="min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-xl text-sm leading-6 text-[#5a5470] sm:text-base">
          Review and process cleaner transfers.
        </p>
        <div className="w-full sm:w-auto">
          <ProcessPayoutsButton />
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:mt-7 sm:grid-cols-2 sm:gap-4">
        <Card label="Due this week" value={formatMoney(week)} />
        <Card label="This month" value={formatMoney(month)} />
      </div>

      <PayoutsTable payouts={payouts} />
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-[#e8e0f4] bg-[#efe6ff] p-4 sm:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#823fb2]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[#1c133b]">
        {value}
      </p>
    </div>
  );
}
