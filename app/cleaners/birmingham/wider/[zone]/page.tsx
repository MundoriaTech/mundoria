import { permanentRedirect } from "next/navigation";

import { houseCleaningCityPath } from "@/lib/seo/public-paths";

/** Wider-zone hubs collapsed into the Birmingham house-cleaning city page. */
export default function BirminghamWiderZoneRedirect() {
  permanentRedirect(houseCleaningCityPath());
}
