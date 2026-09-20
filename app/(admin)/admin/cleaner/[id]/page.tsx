import { redirect } from "next/navigation";

/** Legacy path — keep bookmarks working after moving under /admin/cleaners. */
export default function LegacyAdminCleanerRedirect({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/admin/cleaners/${params.id}`);
}
