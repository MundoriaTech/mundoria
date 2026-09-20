import type { Metadata } from "next";

import { buildPrivateMetadata } from "@/lib/seo/site";

export const metadata: Metadata = buildPrivateMetadata("Account");

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
