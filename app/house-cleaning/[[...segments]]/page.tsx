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
  return publicCategoryMetadata("residential", params.segments ?? []);
}

export default async function HouseCleaningPage({ params }: PageProps) {
  return renderPublicCategoryPage("residential", params.segments ?? []);
}
