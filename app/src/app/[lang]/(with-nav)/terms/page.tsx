import type { SSRProps } from "@/@types";
import { TermsOfService } from "@/presentation/terms";

export default async function ({ params }: SSRProps) {
  const { lang } = await params;

  return <TermsOfService lang={lang} />;
}
