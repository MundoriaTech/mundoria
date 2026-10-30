import { permanentRedirect } from "next/navigation";

import { canonicalCleaningPath } from "@/lib/seo/canonical";
import { marketingServiceBySlug } from "@/lib/seo/marketing";

type PageProps = {
  params: { slug: string };
};

/** Former “service in Birmingham” copies — the main service page is the ranking URL. */
export default function ServiceBirminghamRedirect({ params }: PageProps) {
  const service = marketingServiceBySlug(params.slug);
  permanentRedirect(
    service ? canonicalCleaningPath(service.slug) : "/cleaning",
  );
}
