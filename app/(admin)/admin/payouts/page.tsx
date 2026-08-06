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
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Payouts
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Review and process cleaner transfers.
          </p>
        </div>
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
            className="rounded-xl border border-border bg-card p-4"
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

      <div className="mt-6 hidden overflow-x-auto rounded-xl border bg-card md:block">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="bg-muted/50 text-left">
              <th className="p-3">Cleaner</th>
              <th>Period</th>
              <th>Jobs</th>
              <th>Gross</th>
              <th>Net</th>
              <th>Status</th>
              <th>Transfer ID</th>
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
    <div className="rounded-xl border bg-card p-4 sm:p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
