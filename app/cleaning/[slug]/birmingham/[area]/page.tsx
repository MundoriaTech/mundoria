import { permanentRedirect } from "next/navigation";

import { canonicalCleaningPath } from "@/lib/seo/canonical";

type PageProps = {
  params: { area: string; slug: string };
};

export default function CleaningServiceAreaLegacyRedirect({ params }: PageProps) {
  permanentRedirect(
    `${canonicalCleaningPath(params.slug)}/birmingham/${params.area}`,
  );
}
