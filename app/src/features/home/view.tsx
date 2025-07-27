import type { PageProps } from "@/lib/types/next";

import { HeroSection } from "./components/hero";

export async function HomeView({ params }: PageProps) {
  const { lang } = await params;

  return (
    <main className="flex-1">
      <HeroSection />
    </main>
  );
}
