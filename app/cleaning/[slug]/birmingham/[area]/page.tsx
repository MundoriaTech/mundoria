import { permanentRedirect } from "next/navigation";

import { birminghamCoveragePlaceBySlug } from "@/lib/seo/birmingham-coverage";
import { cleanerPlacePath, canonicalCleaningPath } from "@/lib/seo/canonical";
import {
  birminghamAreaBySlug,
  marketingServiceBySlug,
} from "@/lib/seo/marketing";

type PageProps = {
  params: { area: string; slug: string };
};

/**
 * Former service×area thin pages.
 * Local intent → area hub. Unknown area → main service page.
 */
export default function ServiceBirminghamAreaRedirect({ params }: PageProps) {
  const known =
    birminghamAreaBySlug(params.area) ??
    birminghamCoveragePlaceBySlug(params.area);
  if (known) {
    permanentRedirect(cleanerPlacePath(params.area));
  }
  const service = marketingServiceBySlug(params.slug);
  permanentRedirect(
    service ? canonicalCleaningPath(service.slug) : "/cleaning",
  );
}
