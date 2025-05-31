import type { SSRProps } from "@/@types";
import { SignIn } from "@/presentation/sign-in";

export default async function ({ params }: SSRProps) {
  const { lang } = await params;
  return <SignIn lang={lang} />;
}
