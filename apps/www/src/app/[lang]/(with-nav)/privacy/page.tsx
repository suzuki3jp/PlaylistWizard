import type { Metadata } from "next";

import { MaxWidthContainer } from "@/components/max-width-container";
import { getContent, MDXContent } from "@/features/mdx";
import { useServerT } from "@/presentation/hooks/t/server";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/privacy">): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await useServerT(lang);

  return {
    title: t("privacy.meta.title"),
    description: t("privacy.meta.description"),
    openGraph: {
      title: t("privacy.meta.title"),
      description: t("privacy.meta.description"),
    },
  };
}

export default async function () {
  const { frontmatter, content } = getContent("privacy");
  return (
    <MaxWidthContainer className="min-h-screen">
      <main className="container py-8">
        <div className="space-y-4">
          <h1 className="font-bold text-4xl text-white">{frontmatter.title}</h1>
          <p className="text-gray-400">{frontmatter.effectiveDate}</p>
        </div>
        <div className="mt-8">
          <MDXContent content={content} />
        </div>
      </main>
    </MaxWidthContainer>
  );
}
