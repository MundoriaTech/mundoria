type PageResult<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

/**
 * Load every row of a query in pages of 1,000 (Supabase returns at most
 * 1,000 rows per request, so a plain select silently stops there).
 * `page(from, to)` must apply `.range(from, to)` to an ordered query.
 */
export async function fetchAllRows<T>(
  page: (from: number, to: number) => PageResult<T>,
  options: { max?: number; pageSize?: number } = {},
): Promise<{ data: T[]; error: { message: string } | null }> {
  const pageSize = options.pageSize ?? 1000;
  const max = options.max ?? 20_000;
  const rows: T[] = [];
  for (let from = 0; from < max; from += pageSize) {
    const { data, error } = await page(from, from + pageSize - 1);
    if (error) return { data: rows, error };
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return { data: rows, error: null };
}
