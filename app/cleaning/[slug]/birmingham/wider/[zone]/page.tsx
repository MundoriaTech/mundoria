import { permanentRedirect } from "next/navigation";

import { canonicalCleaningPath } from "@/lib/seo/canonical";
import { marketingServiceBySlug } from "@/lib/seo/marketing";

type PageProps = {
  params: { slug: string; zone: string };
};

/** Wider service×zone pages duplicated local area hubs — collapse to the main service. */
export default function ServiceBirminghamWiderRedirect({ params }: PageProps) {
  const service = marketingServiceBySlug(params.slug);
  permanentRedirect(
    service ? canonicalCleaningPath(service.slug) : "/cleaning",
  );
}
