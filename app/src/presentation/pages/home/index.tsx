import { useServerT } from "@/presentation/hooks/t/server";
import { Faq } from "./faq";
import { Features } from "./features";
import { Hero } from "./hero";

type HomePageProps = { lang: string };

export async function HomePage({ lang }: HomePageProps) {
  const { t } = await useServerT(lang);

  return (
    <main>
      <Hero t={t} />
      <Features t={t} />
      <Faq t={t} />
    </main>
  );
}
