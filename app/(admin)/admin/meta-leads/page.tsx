import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { CallbackLeadsTable } from "@/components/admin/callback-leads-table";
import { mapCallbackLeadRow } from "@/lib/admin/callback-desk";
import { requireAdminArea } from "@/lib/admin/page-access";
import { META_OFFER_SOURCE } from "@/lib/bookings/percent-offer";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Meta 20% leads" };
export const dynamic = "force-dynamic";

const COLUMNS =
  "id,first_name,last_name,phone,email,available_in_10_min,source,utm_source,utm_medium,utm_campaign,created_at,call_status,outcome,area,town,notes,offer_redeemed_booking_id";

export default async function AdminMetaLeadsPage() {
  await requireAdminArea("meta_leads");
  const { data, error } = await fetchAllRows((from, to) =>
    createAdminClient()
    .from("callback_leads")
    .select(COLUMNS)
    .eq("source", META_OFFER_SOURCE)
    .order("created_at", { ascending: false })
      .range(from, to),
  );

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const booked = rows.filter((row) => row.offer_redeemed_booking_id).length;
  const called = rows.filter((row) => row.call_status === "spoke").length;
  const tiles = [
    { label: "Leads", value: String(rows.length) },
    {
      label: "Last 7 days",
      value: String(rows.filter((row) => Date.parse(String(row.created_at)) >= weekAgo).length),
    },
    { label: "Spoken to", value: String(called) },
    {
      label: "Booked with 20% off",
      value: `${booked}${rows.length ? ` (${Math.round((booked / rows.length) * 100)}%)` : ""}`,
    },
  ];
  const campaigns = Array.from(
    rows.reduce((map, row) => {
      const key = String(row.utm_campaign || row.utm_source || "No campaign tag");
      const entry = map.get(key) ?? { booked: 0, leads: 0 };
      entry.leads += 1;
      if (row.offer_redeemed_booking_id) entry.booked += 1;
      map.set(key, entry);
      return map;
    }, new Map<string, { booked: number; leads: number }>()),
  ).sort((a, b) => b[1].leads - a[1].leads);

  return (
    <div className="min-w-0 space-y-5">
      <p className="text-sm text-muted-foreground">
        People who asked for a callback on the 20% off page (/20-off-first-clean).
        Only Maritha, Bosoye and Thelma can see this section.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div className="rounded-xl border bg-card px-4 py-3" key={tile.label}>
            <p className="text-xs font-medium text-muted-foreground">{tile.label}</p>
            <p className="mt-1 text-2xl font-semibold">{tile.value}</p>
          </div>
        ))}
      </div>
      {campaigns.length ? (
        <section className="rounded-xl border bg-card p-4">
          <h2 className="text-sm font-semibold">By Meta campaign</h2>
          <ul className="mt-2 divide-y text-sm">
            {campaigns.map(([name, stats]) => (
              <li className="flex items-center justify-between gap-3 py-2" key={name}>
                <span className="min-w-0 truncate">{name}</span>
                <span className="shrink-0 text-muted-foreground">
                  {stats.leads} lead{stats.leads === 1 ? "" : "s"} · {stats.booked} booked
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {error ? (
        <p className="text-sm text-[#9a3412]">These leads could not be loaded. Refresh the page.</p>
      ) : (
        <CallbackLeadsTable
          basePath="/admin/meta-leads"
          rows={rows.map((row) => mapCallbackLeadRow(row))}
        />
      )}
    </div>
  );
}
