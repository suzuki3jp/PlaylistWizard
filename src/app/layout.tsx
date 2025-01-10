import type { Metadata } from "next";
import "./global.css";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ClientSessionProvider } from "@/components/providers/client-session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { useServerT } from "@/hooks";
import { fontMono, fontSans } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { searchParams } from "next-extra/pathname";

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

    return (
        <html
            lang={lng}
            className={cn(fontMono.variable, fontSans.variable)}
            suppressHydrationWarning
        >
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
