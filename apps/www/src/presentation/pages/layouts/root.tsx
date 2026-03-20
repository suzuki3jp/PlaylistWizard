import { GoogleAnalytics } from "@next/third-parties/google";
import { dir } from "i18next";
import type { PropsWithChildren } from "react";
import "@/app/global.css";

import { ThemeProvider } from "@/features/providers/theme-provider";
import { LangAtomHydrator } from "@/presentation/hydrator/lang-atom";
import { Providers } from "@/presentation/providers";

type RootLayoutProps = PropsWithChildren<{ gaId: string; lang: string }>;

/**
 * Root layout component for the application.
 * @param param0
 * @returns
 */
export function RootLayout({ gaId, lang, children }: RootLayoutProps) {
  return (
    <html lang={lang} dir={dir(lang)}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>

      {process.env.VERCEL_ENV === "production" && (
        <GoogleAnalytics gaId={gaId} />
      )}
      <body className="antialiased">
        <ThemeProvider>
          <div className="flex min-h-screen flex-col bg-gray-950">
            <Providers>
              <LangAtomHydrator lang={lang} />
              {children}
            </Providers>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
