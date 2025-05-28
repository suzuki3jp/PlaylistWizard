import type { SSRProps } from "@/@types";
import { Terms } from "@/features/terms/components/Terms";

export default async function ({ params }: SSRProps) {
  const { lang } = await params;

  return <Terms lang={lang} />;
}
