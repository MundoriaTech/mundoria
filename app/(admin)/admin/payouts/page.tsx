import { ProcessPayoutsButton } from "@/components/admin/process-payouts-button";
import { formatMoney } from "@/lib/customer/services";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminPayoutsPage() {
  const { data } = await createAdminClient()
    .from("payouts")
    .select("*,cleaner:profiles!payouts_cleaner_id_fkey(full_name)")
    .order("created_at", { ascending: false });
  const payouts = data ?? [];
  const now = new Date();
  const week = payouts
    .filter((item) => item.status === "pending" && Date.now() - new Date(item.created_at).getTime() < 7 * 864e5)
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
  return <div><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-semibold">Payouts</h1><p className="mt-2 text-muted-foreground">Review and process cleaner transfers.</p></div><ProcessPayoutsButton/></div><div className="mt-7 grid gap-4 sm:grid-cols-2"><Card label="Due this week" value={formatMoney(week)}/><Card label="This month" value={formatMoney(month)}/></div><div className="mt-6 overflow-x-auto rounded-xl border bg-card"><table className="w-full min-w-[900px] text-sm"><thead><tr className="bg-muted/50 text-left"><th className="p-3">Cleaner</th><th>Period</th><th>Jobs</th><th>Gross</th><th>Net</th><th>Status</th><th>Transfer ID</th></tr></thead><tbody>{payouts.map(item=><tr className="border-t" key={item.id}><td className="p-3">{item.cleaner?.full_name}</td><td>{item.period_start} – {item.period_end}</td><td>{item.total_jobs}</td><td>{formatMoney(item.gross_amount)}</td><td className="font-semibold">{formatMoney(item.net_amount)}</td><td className="capitalize">{item.status}</td><td className="font-mono text-xs">{item.stripe_transfer_id??"—"}</td></tr>)}</tbody></table></div></div>;
}
function Card({label,value}:{label:string;value:string}){return <div className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>}
