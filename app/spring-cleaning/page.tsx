import type { Metadata } from "next";

import {
  renderStandalonePage,
  standalonePageMetadata,
} from "@/lib/seo/render-standalone-page";

export const revalidate = 300;

export const metadata: Metadata = standalonePageMetadata("spring-cleaning");

export default async function Page() {
  return renderStandalonePage("spring-cleaning");
}
