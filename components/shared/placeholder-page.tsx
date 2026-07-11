interface PlaceholderPageProps {
  audience: "Customer" | "Cleaner" | "Admin" | "Account";
  title: string;
}

export function PlaceholderPage({ audience, title }: PlaceholderPageProps) {
  return (
    <main className="min-h-screen bg-muted/40 p-6 sm:p-10">
      <section className="mx-auto max-w-5xl rounded-xl border bg-card p-8 shadow-sm">
        <p className="text-sm font-medium text-primary">{audience}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-muted-foreground">
          This route is ready for its CleanScape feature implementation.
        </p>
      </section>
    </main>
  );
}
