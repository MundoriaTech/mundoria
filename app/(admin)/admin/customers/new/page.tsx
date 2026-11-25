import { AssistedCustomerForm } from "@/components/admin/assisted-customer-form";

export const metadata = { title: "Create account / book for a customer" };

export default function AdminAssistedCustomerPage() {
  return (
    <div className="min-w-0 max-w-3xl space-y-4">
      <p className="text-sm leading-6 text-muted-foreground">
        For customers who need help, for example on the phone. We create their
        account and email them a link to set a password. If you prepare a
        booking, that link then opens it so they can check the details and add
        their own card. If the email already has an account, we just send them
        the booking to confirm.
      </p>
      <AssistedCustomerForm />
    </div>
  );
}
