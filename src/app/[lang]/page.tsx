import type { SSRProps } from "@/@types";
import { Features } from "@/components/features";
import { Hero } from "@/components/hero";
import { useServerT } from "@/i18n/server";

export default async function Home({ params }: SSRProps) {
    const { lang } = await params;
    const { t } = await useServerT(lang);

    return (
        <main>
            <Hero t={t} lang={lang} />
            <Features t={t} />
        </main>
    );
}
