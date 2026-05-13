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
        <h2 className="font-semibold text-2xl text-foreground">{title}</h2>
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
    <div className="flex min-h-28 flex-col justify-between gap-4 rounded-lg border bg-card p-4 text-card-foreground">
      <h3 className="font-medium text-muted-foreground text-sm">{title}</h3>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
