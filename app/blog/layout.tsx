import { MagShell } from "@/components/marketing/mag-shell";

export const dynamic = "force-dynamic";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MagShell>{children}</MagShell>;
}
