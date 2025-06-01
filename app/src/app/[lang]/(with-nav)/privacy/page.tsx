import type { SSRProps } from "@/@types";
import { PrivacyPolicy } from "@/presentation/privacy";

export default async function ({ params }: SSRProps) {
  const { lang } = await params;

  return <PrivacyPolicy lang={lang} />;
}
