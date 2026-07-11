import { Clock3, ShieldCheck } from "lucide-react";

export function ApplicationReview() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-lg rounded-2xl border bg-background p-8 text-center shadow-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700"><Clock3 className="h-7 w-7" /></span>
        <h1 className="mt-5 text-2xl font-semibold">Application under review</h1>
        <p className="mt-3 text-muted-foreground">Our team is checking your identity and DBS documents. We’ll notify you as soon as your account is activated.</p>
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-emerald-800"><ShieldCheck className="h-4 w-4" />Your documents are stored securely.</div>
      </div>
    </main>
  );
}
