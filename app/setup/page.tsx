import { CheckCircle2, CircleAlert, ExternalLink } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { buildPrivateMetadata } from "@/lib/seo/site";
import {
  hasSupabasePublicConfig,
  missingSupabasePublicConfig,
} from "@/lib/supabase/config";

export const metadata = buildPrivateMetadata("Project setup");

export default function SetupPage() {
  if (hasSupabasePublicConfig()) redirect("/login");
  const missing = missingSupabasePublicConfig();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f2ea] px-6 py-12">
      <section className="w-full max-w-2xl rounded-[1.75rem] border border-[#e4daf5]/80 bg-white/95 p-6 shadow-[0_16px_40px_rgba(49,44,121,0.1)] sm:p-9">
        <p className="text-xl font-black tracking-[-0.06em] text-[#1c133b]">
          Mundoria
        </p>
        <span className="mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#efe6ff] text-[#6a45b8]">
          <CircleAlert className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-[#1c133b]">
          Connect Supabase
        </h1>
        <p className="mt-2 text-[#5a5470]">
          Mundoria is running, but authentication and database access need your
          Supabase project credentials.
        </p>

        <div className="mt-6 rounded-xl bg-[#1c133b] p-4 font-mono text-sm text-white/90">
          {missing.map((name) => (
            <p key={name}>{name}=</p>
          ))}
        </div>

        <ol className="mt-6 space-y-4 text-sm text-[#5a5470]">
          <li className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#6a45b8]" />
            <span>
              Open your Supabase project and copy the project URL and anon
              public key from Project Settings → API.
            </span>
          </li>
          <li className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#6a45b8]" />
            <span>
              Add both values to <code>.env.local</code> without quotes.
            </span>
          </li>
          <li className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#6a45b8]" />
            <span>
              Restart <code>npm run dev</code> so Next.js reloads the
              environment.
            </span>
          </li>
        </ol>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            asChild
            className="rounded-full bg-[#6a45b8] px-5 font-semibold text-white hover:bg-[#5a38a3]"
          >
            <a
              href="https://supabase.com/dashboard"
              rel="noreferrer"
              target="_blank"
            >
              Open Supabase
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button asChild className="rounded-full" variant="outline">
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
