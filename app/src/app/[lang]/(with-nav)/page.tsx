import type { SSRProps } from "@/@types";
import { useServerT } from "@/features/localization/hooks/server";
import { Faq } from "@/presentation/home/faq";
import { Features } from "@/presentation/home/features";
import { Hero } from "@/presentation/home/hero";

export default async function Home({ params }: SSRProps) {
  const { lang } = await params;
  const { t } = await useServerT(lang);

  return (
    <main>
      <Hero t={t} lang={lang} />
      <Features t={t} />
      <Faq t={t} />
    </main>
  );
}
