import type { SSRProps } from "@/@types";
import { Privacy } from "@/features/privacy/components/Privacy";

export default async function ({ params }: SSRProps) {
  const { lang } = await params;

  return <Privacy lang={lang} />;
}
