import { PrivacyPolicyPage } from "@/presentation/pages/privacy";

export default async function ({ params }: PageProps<"/[lang]/privacy">) {
  const { lang } = await params;

  return <PrivacyPolicyPage lang={lang} />;
}
