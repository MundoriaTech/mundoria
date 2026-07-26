export const LONDON_CENTER = { lat: 51.5074, lng: -0.1278 };

export function getGeoapifyApiKey() {
  return process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY ?? "";
}

export function getGeoapifyMapStyleUrl(apiKey: string) {
  return `https://maps.geoapify.com/v1/styles/osm-bright/style.json?apiKey=${encodeURIComponent(apiKey)}`;
}

export interface GeoapifyFeature {
  properties: {
    address_line1?: string;
    address_line2?: string;
    city?: string;
    country_code?: string;
    formatted?: string;
    lat: number;
    lon: number;
    postcode?: string;
    street?: string;
  };
}

export interface GeoapifyAutocompleteResponse {
  features: GeoapifyFeature[];
}
