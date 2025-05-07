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

export const metadata: Metadata = {
    title: "PlaylistWizard - Easily manage and organize your playlists on the web!",
    description: "You can easily manage and organize your playlists.",
};

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
