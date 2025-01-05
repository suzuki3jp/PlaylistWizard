import { GitHub as GitHubIcon } from "@mui/icons-material";
import React from "react";

import { Link } from "@/components/link";
import { GithubButton } from "./github-button";
import { ToggleTheme } from "./toggle-theme";

/**
 * The header component.
 */
export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between">
                <Link href="/">
                    <div className="flex items-center gap-4">
                        <img
                            src="favicon.ico"
                            alt="BrandLogo"
                            className="max-h-7 object-contain"
                        />
                        <h1 className="text-xl font-bold tracking-tight">
                            PlaylistWizard
                        </h1>
                    </div>
                </Link>

                <div className="flex items-center gap-4">
                    <ToggleTheme />
                    <GithubButton />
                </div>
            </div>
        </header>
    );
}
