import { notFound, permanentRedirect } from "next/navigation";

import {
  canonicalCleaningPath,
  isIndexableServiceSlug,
} from "@/lib/seo/canonical";
import { marketingServiceBySlug } from "@/lib/seo/marketing";

type PageProps = {
  params: { slug: string };
};

/** Legacy `/cleaning/{slug}` → new public category/service path. */
export default function CleaningServiceLegacyRedirect({ params }: PageProps) {
  if (!isIndexableServiceSlug(params.slug)) {
    permanentRedirect(canonicalCleaningPath(params.slug));
  }
  const service = marketingServiceBySlug(params.slug);
  if (!service) notFound();
  permanentRedirect(canonicalCleaningPath(service.slug));
}
