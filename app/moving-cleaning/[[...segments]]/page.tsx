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
  return publicCategoryMetadata("moving_home", params.segments ?? []);
}

export default async function MovingCleaningPage({ params }: PageProps) {
  return renderPublicCategoryPage("moving_home", params.segments ?? []);
}
