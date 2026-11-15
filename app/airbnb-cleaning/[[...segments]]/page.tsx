import type { Metadata } from "next";

import {
  publicCategoryMetadata,
  renderPublicCategoryPage,
} from "@/lib/seo/render-public-category-page";

export const revalidate = 300;

type PageProps = {
  params: { segments?: string[] };
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  return publicCategoryMetadata("short_term_rental", params.segments ?? []);
}

export default async function AirbnbCleaningPage({ params }: PageProps) {
  return renderPublicCategoryPage("short_term_rental", params.segments ?? []);
}
