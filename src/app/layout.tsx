import type { Metadata } from "next";
import "./global.css";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { fontMono, fontSans } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
    title: "PlaylistWizard",
    description:
        "You can copy, shuffle, merge, manage, and delete Youtube (music) playlists",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={cn(fontMono.variable, fontSans.variable)}
            suppressHydrationWarning
        >
            <body>
                <ThemeProvider attribute="class" defaultTheme="dark">
                    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-background/95">
                        <Header />
                        <main className="container py-8 space-y-12 w-10/12 mx-auto lg:w-9/12">
                        {children}
                        </main>
                        <Footer />
                    </div>
                </ThemeProvider>
            </body>
        </html>
    );
}
