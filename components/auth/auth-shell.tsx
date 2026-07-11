import Link from "next/link";

interface AuthShellProps {
  children: React.ReactNode;
  description: string;
  footer: React.ReactNode;
  title: string;
}

export function AuthShell({
  children,
  description,
  footer,
  title,
}: AuthShellProps) {
  return (
    <main className="grid min-h-screen bg-emerald-950 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="hidden flex-col justify-between p-12 text-white lg:flex">
        <Link className="text-xl font-semibold tracking-tight" href="/">
          CleanScape
        </Link>
        <div className="max-w-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
            Cleaning, thoughtfully matched
          </p>
          <h2 className="mt-5 text-5xl font-semibold leading-tight">
            More time for life. Better work for cleaners.
          </h2>
        </div>
        <p className="text-sm text-emerald-200">
          Trusted local cleaning, managed in one calm place.
        </p>
      </section>

      <section className="flex items-center justify-center bg-background px-5 py-10 sm:px-8 lg:rounded-l-[2rem]">
        <div className="w-full max-w-md">
          <Link
            className="mb-10 inline-block text-xl font-semibold text-primary lg:hidden"
            href="/"
          >
            CleanScape
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-7 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        </div>
      </section>
    </main>
  );
}
