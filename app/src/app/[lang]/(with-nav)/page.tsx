import type { SSRProps } from "@/@types";
import { Faq } from "@/presentation/home/faq";
import { Features } from "@/presentation/home/features";
import { Hero } from "@/presentation/home/hero";
import { useServerT } from "@/presentation/hooks/t/server";

export default async function Home({ params }: SSRProps) {
  const { lang } = await params;
  const { t } = await useServerT(lang);

  return (
    <main>
      <Hero t={t} />
      <Features t={t} />
      <Faq t={t} />
    </main>
  );
}
