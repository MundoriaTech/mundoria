import { redirect } from "next/navigation";

/** /cleaner on its own used to 404; send pros to their dashboard. */
export default function CleanerIndexPage() {
  redirect("/cleaner/dashboard");
}
