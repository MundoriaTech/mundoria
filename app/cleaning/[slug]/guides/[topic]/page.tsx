import { permanentRedirect } from "next/navigation";

import { canonicalCleaningPath } from "@/lib/seo/canonical";

type PageProps = {
  params: { slug: string; topic: string };
};

/** Service guides collapse onto the live service page. */
export default function CleaningServiceGuideLegacyRedirect({ params }: PageProps) {
  permanentRedirect(canonicalCleaningPath(params.slug));
}
