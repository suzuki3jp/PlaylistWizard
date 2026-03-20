import { useServerT } from "@/presentation/hooks/t/server";
import { ComparisonSection } from "./components/comparison";
import { FaqSection } from "./components/faq";
import { HeroSection } from "./components/hero";

export async function HomeView({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  const { t } = await useServerT(lang, "home");

  return (
    <main className="flex-1">
      <HeroSection t={t} />
      <ComparisonSection t={t} />
      <FaqSection t={t} />
    </main>
  );
}
