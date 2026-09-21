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

      <div className="mt-6 space-y-3 md:hidden">
        {payouts.map((item) => (
          <div
            className="rounded-[1.25rem] border border-[#e8e0f4] bg-white p-4 shadow-[0_8px_20px_rgba(49,44,121,0.04)]"
            key={item.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {item.cleaner?.full_name ?? "Cleaner"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.period_start} – {item.period_end}
                </p>
              </div>
              <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs capitalize">
                {item.status}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span>{item.total_jobs} jobs</span>
              <span className="font-semibold">
                {formatMoney(item.net_amount)}
              </span>
            </div>
            {item.stripe_transfer_id ? (
              <p className="mt-2 truncate font-mono text-xs text-muted-foreground">
                {item.stripe_transfer_id}
              </p>
            ) : null}
          </div>
        ))}
        {!payouts.length ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No payouts yet.
          </p>
        ) : null}
      </div>

      <div className="mt-6 hidden overflow-x-auto rounded-[1.25rem] border border-[#e8e0f4] bg-white shadow-[0_8px_20px_rgba(49,44,121,0.04)] md:block">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="bg-[#f7f4fb] text-left text-[#5a5470]">
              <th className="p-3 font-semibold">Cleaner</th>
              <th className="font-semibold">Period</th>
              <th className="font-semibold">Jobs</th>
              <th className="font-semibold">Gross</th>
              <th className="font-semibold">Net</th>
              <th className="font-semibold">Status</th>
              <th className="font-semibold">Transfer ID</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((item) => (
              <tr className="border-t" key={item.id}>
                <td className="p-3">{item.cleaner?.full_name}</td>
                <td>
                  {item.period_start} – {item.period_end}
                </td>
                <td>{item.total_jobs}</td>
                <td>{formatMoney(item.gross_amount)}</td>
                <td className="font-semibold">
                  {formatMoney(item.net_amount)}
                </td>
                <td className="capitalize">{item.status}</td>
                <td className="font-mono text-xs">
                  {item.stripe_transfer_id ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
