import type { PageProps } from "@/lib/types/next";

import { useServerT } from "@/presentation/hooks/t/server";
import { HeroSection } from "./components/hero";

export async function HomeView({ params }: PageProps) {
  const { lang } = await params;
  const { t } = await useServerT(lang, "home");

  return (
    <main className="flex-1">
      <HeroSection t={t} />
    </main>
  );
}
