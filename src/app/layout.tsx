import type { Metadata } from "next";
import { searchParams } from "next-extra/pathname";
import Script from "next/script";
import "./global.css";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ClientSessionProvider } from "@/components/providers/client-session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { useServerT } from "@/hooks";
import { fontMono, fontSans } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { getEnv } from "@/utils";

export const metadata: Metadata = {
    title: "PlaylistWizard",
    description:
        "You can copy, shuffle, merge, manage, and delete Youtube (music) playlists",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const params = await searchParams();
    const { lng } = await useServerT(params);
    const gaId = getEnv(["GOOGLE_ANALYTICS_ID"]).throw()[0];

    return (
        <html
            lang={lng}
            className={cn(fontMono.variable, fontSans.variable)}
            suppressHydrationWarning
        >
            <head>
                <Script
                    src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
                    strategy="afterInteractive"
                    async
                />
                <Script id="google-analytics" strategy="afterInteractive">
                    {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `}
                </Script>
            </head>
            <body>
                <ThemeProvider attribute="class" defaultTheme="dark">
                    <ClientSessionProvider>
                        <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-background/95">
                            <Header />
                            <main className="container py-8 space-y-12 w-10/12 mx-auto lg:w-9/12">
                                {children}
                            </main>
                            <Footer />
                        </div>
                    </ClientSessionProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
