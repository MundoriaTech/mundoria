import Link from "next/link";

import { Button } from "@/components/ui/button";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export default function HomePage() {
  const configured = hasSupabasePublicConfig();

  return (
    <main className="flex min-h-screen items-center justify-center bg-emerald-50 px-6">
      <section className="max-w-2xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          CleanScape
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          A cleaner space, without the chase.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          Book trusted independent cleaning professionals and manage every job
          in one place.
        </p>
        <Button asChild className="mt-8">
          <Link href={configured ? "/login" : "/setup"}>
            {configured ? "Get started" : "Finish setup"}
          </Link>
        </Button>
      </section>
    </main>
  );
}
