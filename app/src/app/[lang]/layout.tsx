import { GoogleAnalytics } from "@next/third-parties/google";
import { dir } from "i18next";
import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import "./globals.css";

import type { SSRProps } from "@/@types";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Providers } from "@/components/provider";
import { getEnv } from "@/helpers/getEnv";
import { useServerT } from "@/i18n/server";
import { supportedLangs } from "@/i18n/settings";

export async function generateMetadata({
  params,
}: SSRProps): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await useServerT(lang);

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export const generateStaticParams = () => {
  return supportedLangs.map((lang) => ({ lang }));
};

export default async function RootLayout({
  children,
  params,
}: PropsWithChildren<SSRProps>) {
  const { lang } = await params;
  const { t } = await useServerT(lang);
  const gaId = getEnv(["GOOGLE_ANALYTICS_ID"]);
  if (gaId.isErr()) throw gaId.error;

  return (
    <html lang={lang} dir={dir(lang)}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>

      <GoogleAnalytics gaId={gaId.value[0]} />
      <body className="antialiased">
        <div className="flex min-h-screen flex-col bg-gray-950">
          <Providers>
            <Header t={t} lang={lang} />
            {children}
            <Footer t={t} />
          </Providers>
        </div>
      </body>
    </html>
  );
}
