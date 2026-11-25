import { requireAdminArea } from "@/lib/admin/page-access";
import { AddLeadForm } from "@/components/admin/add-lead-form";

export const metadata = { title: "Add lead" };

export default async function AdminAddLeadPage() {
  await requireAdminArea("leads");
  return (
    <div className="min-w-0 max-w-2xl space-y-4">
      <p className="text-sm leading-6 text-muted-foreground">
        Add someone who contacted you outside the website, for example by
        phone, in person or through a referral. Nothing is sent to them
        automatically; you can start follow-ups from their lead page.
      </p>
      <AddLeadForm />
    </div>
  );
}
