import { FaqShell } from "@/components/marketing/faq-shell";

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FaqShell>{children}</FaqShell>;
}
