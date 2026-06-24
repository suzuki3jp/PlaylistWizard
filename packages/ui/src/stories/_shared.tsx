import type { ReactNode } from "react";

export function CatalogSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="w-full max-w-4xl space-y-4">
      <div className="space-y-1">
        <h2 className="text-foreground text-2xl font-semibold">{title}</h2>
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function CatalogGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
  );
}

export function CatalogItem({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-card text-card-foreground flex min-h-28 flex-col justify-between gap-4 rounded-lg border p-4">
      <h3 className="text-muted-foreground text-sm font-medium">{title}</h3>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
