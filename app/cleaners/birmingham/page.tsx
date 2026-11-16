import { permanentRedirect } from "next/navigation";

import { houseCleaningCityPath } from "@/lib/seo/public-paths";

/** Former house-cleaners Birmingham hub - merged into house cleaning city page. */
export default function BirminghamCleanersRedirect() {
  permanentRedirect(houseCleaningCityPath());
}
