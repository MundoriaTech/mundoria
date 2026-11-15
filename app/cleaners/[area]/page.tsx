import { notFound, permanentRedirect } from "next/navigation";

import { isStandaloneTownSlug } from "@/lib/seo/canonical";
import { houseCleaningPlacePath } from "@/lib/seo/public-paths";

type PageProps = {
  params: { area: string };
};

/** Standalone town hubs now live under `/house-cleaning/{town}`. */
export default function StandaloneTownCleanersRedirect({ params }: PageProps) {
  if (!isStandaloneTownSlug(params.area)) notFound();
  permanentRedirect(houseCleaningPlacePath(params.area));
}
