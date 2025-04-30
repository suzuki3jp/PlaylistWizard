import { dir } from "i18next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { PropsWithChildren } from "react";
import "./globals.css";

import type { SSRProps } from "@/@types";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { useServerT } from "@/i18n/server";
import { supportedLangs } from "@/i18n/settings";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

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

    return (
        <html lang={lang} dir={dir(lang)}>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <div className="flex min-h-screen flex-col bg-gray-950">
                    <Header t={t} />
                    {children}
                    <Footer t={t} />
                </div>
            </body>
        </html>
    );
}
