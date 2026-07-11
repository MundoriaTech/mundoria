import { CheckCircle2, CircleAlert, ExternalLink } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  hasSupabasePublicConfig,
  missingSupabasePublicConfig,
} from "@/lib/supabase/config";

export const metadata = {
  title: "Project setup",
};

export default function SetupPage() {
  if (hasSupabasePublicConfig()) redirect("/login");
  const missing = missingSupabasePublicConfig();

  return (
    <main className="flex min-h-screen items-center justify-center bg-emerald-50 px-6 py-12">
      <section className="w-full max-w-2xl rounded-2xl border bg-background p-6 shadow-sm sm:p-9">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <CircleAlert className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold">Connect Supabase</h1>
        <p className="mt-2 text-muted-foreground">
          CleanScape is running, but authentication and database access need
          your Supabase project credentials.
        </p>

        <div className="mt-6 rounded-xl bg-slate-950 p-4 font-mono text-sm text-slate-100">
          {missing.map((name) => (
            <p key={name}>{name}=</p>
          ))}
        </div>

        <ol className="mt-6 space-y-4 text-sm">
          <li className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span>
              Open your Supabase project and copy the project URL and anon
              public key from Project Settings → API.
            </span>
          </li>
          <li className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span>
              Add both values to <code>.env.local</code> without quotes.
            </span>
          </li>
          <li className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span>
              Restart <code>npm run dev</code> so Next.js reloads the
              environment.
            </span>
          </li>
        </ol>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <a
              href="https://supabase.com/dashboard"
              rel="noreferrer"
              target="_blank"
            >
              Open Supabase
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
