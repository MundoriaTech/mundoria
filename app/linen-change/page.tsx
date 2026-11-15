import type { Metadata } from "next";

import {
  renderStandalonePage,
  standalonePageMetadata,
} from "@/lib/seo/render-standalone-page";

export const revalidate = 300;

export const metadata: Metadata = standalonePageMetadata("linen-change");

export default async function Page() {
  return renderStandalonePage("linen-change");
}
