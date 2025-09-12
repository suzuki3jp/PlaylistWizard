import { TermsOfServicePage } from "@/presentation/pages/terms";

export default async function ({ params }: PageProps<"/[lang]/terms">) {
  const { lang } = await params;

  return <TermsOfServicePage lang={lang} />;
}
