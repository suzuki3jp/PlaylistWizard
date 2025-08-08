import type { SSRProps } from "@/lib/types/next";
import { TermsOfServicePage } from "@/presentation/pages/terms";

export default async function ({ params }: SSRProps) {
  const { lang } = await params;

  return <TermsOfServicePage lang={lang} />;
}
