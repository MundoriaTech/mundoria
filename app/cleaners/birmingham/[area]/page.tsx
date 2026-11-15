import { permanentRedirect } from "next/navigation";

import { houseCleaningPlacePath } from "@/lib/seo/public-paths";

type PageProps = {
  params: { area: string };
};

/** Former cleaners area hubs — merged into house-cleaning place pages. */
export default function BirminghamAreaCleanersRedirect({ params }: PageProps) {
  permanentRedirect(houseCleaningPlacePath(params.area));
}
