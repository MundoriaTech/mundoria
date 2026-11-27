/** Best-effort coordinates for an address; matching falls back to the postcode. */
export async function geocodeAddress(text: string) {
  const key = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
  if (!key) return null;
  try {
    const url = new URL("https://api.geoapify.com/v1/geocode/search");
    url.searchParams.set("text", text);
    url.searchParams.set("filter", "countrycode:gb");
    url.searchParams.set("limit", "1");
    url.searchParams.set("format", "json");
    url.searchParams.set("apiKey", key);
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as { results?: Array<{ lat?: number; lon?: number }> };
    const hit = data.results?.[0];
    return hit?.lat != null && hit?.lon != null ? { lat: hit.lat, lon: hit.lon } : null;
  } catch {
    return null;
  }
}
