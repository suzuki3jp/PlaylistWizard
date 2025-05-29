import type { SSRProps } from "@/@types";
import { Login } from "@/features/login/components/login";

export default async function LoginPage({ params }: SSRProps) {
  const { lang } = await params;
  return <Login lang={lang} />;
}
