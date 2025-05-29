import type { SSRProps } from "@/@types";
import { Faq, Features, Hero } from "@/features/home";
import { useServerT } from "@/features/localization/hooks/server";

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
