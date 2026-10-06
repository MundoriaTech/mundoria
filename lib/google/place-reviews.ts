const LISTING_QUERY = "Mundoria Uk 32 High Street Bromsgrove";
const LISTING_URL =
  "https://www.google.com/maps/place/Mundoria+Uk/@52.3339842,-2.0614516,17z/data=!4m6!3m5!1s0x4870eba9a6e602c7:0xfdaf7049e604835c!8m2!3d52.3339842!4d-2.0614516!16s%2Fg%2F11zxk800xs";

export type GooglePlaceReview = {
  author: string;
  authorUrl: string | null;
  id: string;
  photoUrl: string | null;
  rating: number;
  relativeTime: string;
  text: string;
};

export type GooglePlaceReviews = {
  listingUrl: string;
  name: string;
  rating: number;
  reviewCount: number;
  reviews: GooglePlaceReview[];
};

type PlacePayload = {
  displayName?: { text?: string };
  googleMapsUri?: string;
  id?: string;
  rating?: number;
  reviews?: Array<{
    authorAttribution?: {
      displayName?: string;
      photoUri?: string;
      uri?: string;
    };
    name?: string;
    rating?: number;
    relativePublishTimeDescription?: string;
    text?: { text?: string };
  }>;
  userRatingCount?: number;
};

function apiKey() {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  return key || null;
}

function mapPlace(place: PlacePayload): GooglePlaceReviews | null {
  if (!place.rating || !place.userRatingCount) return null;
  const reviews = (place.reviews ?? [])
    .map((review, index) => ({
      author: review.authorAttribution?.displayName?.trim() || "Google user",
      authorUrl: review.authorAttribution?.uri ?? null,
      id: review.name || `${place.id ?? "review"}-${index}`,
      photoUrl: review.authorAttribution?.photoUri ?? null,
      rating: review.rating ?? 0,
      relativeTime: review.relativePublishTimeDescription ?? "",
      text: review.text?.text?.trim() ?? "",
    }))
    .filter((review) => review.rating > 0);

  return {
    listingUrl: place.googleMapsUri || LISTING_URL,
    name: place.displayName?.text?.trim() || "Mundoria Uk",
    rating: place.rating,
    reviewCount: place.userRatingCount,
    reviews,
  };
}

async function placeDetails(id: string, key: string) {
  const response = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`,
    {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "id,displayName,rating,userRatingCount,googleMapsUri,reviews",
      },
      next: { revalidate: 3600 },
    },
  );
  if (!response.ok) return null;
  return mapPlace((await response.json()) as PlacePayload);
}

async function findPlaceId(key: string) {
  const configured = process.env.GOOGLE_PLACE_ID?.trim();
  if (configured) return configured;

  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "places.id,places.displayName",
      },
      body: JSON.stringify({
        pageSize: 5,
        textQuery: LISTING_QUERY,
      }),
      next: { revalidate: 3600 },
    },
  );
  if (!response.ok) return null;
  const payload = (await response.json()) as {
    places?: Array<{ displayName?: { text?: string }; id?: string }>;
  };
  const match =
    payload.places?.find((place) =>
      /mundoria/i.test(place.displayName?.text ?? ""),
    ) ?? payload.places?.[0];
  return match?.id ?? null;
}

export async function getGooglePlaceReviews(): Promise<GooglePlaceReviews | null> {
  const key = apiKey();
  if (!key) return null;
  try {
    const id = await findPlaceId(key);
    if (!id) return null;
    return await placeDetails(id, key);
  } catch {
    return null;
  }
}
