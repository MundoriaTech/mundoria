import type { Metadata } from "next";

import { MagShell } from "@/components/marketing/mag-shell";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  description:
    "Mundoria Mag — cleaning tips, home care, host guides, Birmingham life and cleaner stories.",
  path: "/blog",
  title: "Mundoria Mag | Cleaning & home magazine",
});

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MagShell>{children}</MagShell>;
}
