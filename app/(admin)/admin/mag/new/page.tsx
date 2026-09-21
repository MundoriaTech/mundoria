import { MagPostEditor } from "@/components/admin/mag-post-editor";

export const metadata = {
  robots: { index: false, follow: false },
  title: "New Mag post | Admin",
};

export default function AdminMagNewPage() {
  return <MagPostEditor />;
}
