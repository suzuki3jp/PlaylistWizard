import React, { Suspense } from "react";

import { Link } from "@/components/link";
import { GithubButton } from "./github-button";
import { GoogleAuthButton } from "./google-auth-button";
import { SelectLanguage } from "./select-language";
import { SettingsMenu } from "./settings-menu";
import { ToggleTheme } from "./toggle-theme";

/**
 * The header component.
 */
export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex w-10/12 h-16 items-center justify-between lg:w-9/12">
                <Link href="/">
                    <div className="flex items-center gap-4">
                        <img
                            src="favicon.ico"
                            alt="BrandLogo"
                            className="max-h-7 object-contain"
                        />
                        <h1 className="text-xl font-bold tracking-tight hidden sm:block">
                            PlaylistWizard
                        </h1>
                    </div>
                </Link>

                <div className="flex items-center gap-4">
                    <Suspense>
                        <SelectLanguage />
                        <GoogleAuthButton />
                        <ToggleTheme />
                        <GithubButton />
                        <SettingsMenu />
                    </Suspense>
                </div>
            </div>
        </header>
    );
}
