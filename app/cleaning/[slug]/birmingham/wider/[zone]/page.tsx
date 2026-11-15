import { permanentRedirect } from "next/navigation";

import { canonicalCleaningPath } from "@/lib/seo/canonical";

type PageProps = {
  params: { slug: string };
};

export default function CleaningServiceWiderLegacyRedirect({ params }: PageProps) {
  permanentRedirect(`${canonicalCleaningPath(params.slug)}/birmingham`);
}
