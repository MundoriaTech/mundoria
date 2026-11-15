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
  return publicCategoryMetadata("recovery", params.segments ?? []);
}

export default async function RecoveryCleaningPage({ params }: PageProps) {
  return renderPublicCategoryPage("recovery", params.segments ?? []);
}
