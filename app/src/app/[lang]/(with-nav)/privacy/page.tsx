import type { SSRProps } from "@/lib/types/next";
import { PrivacyPolicyPage } from "@/presentation/pages/privacy";

export default async function ({ params }: SSRProps) {
  const { lang } = await params;

  return <PrivacyPolicyPage lang={lang} />;
}
