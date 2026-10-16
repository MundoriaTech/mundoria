import { PhotoFeatureBand } from "@/components/marketing/service-category/photo-feature-band";
import type { PlacePageFocus } from "@/lib/seo/place-page-focus";

/** Place pages use the same photo feature band as category/service marketing. */
export function PlaceFeatureBand({ focus: _focus }: { focus?: PlacePageFocus }) {
  return <PhotoFeatureBand />;
}
