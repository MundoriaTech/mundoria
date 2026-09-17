import { HelpShell } from "@/components/marketing/help-shell";

export const dynamic = "force-dynamic";

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <HelpShell>{children}</HelpShell>;
}
