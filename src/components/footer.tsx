import { searchParams } from "next-extra/pathname";
import type React from "react";

import { Separator } from "@/components/shadcn-ui/separator";
import { Link } from "@/components/ui/link";
import { AUTHOR_GITHUB, AUTHOR_NAME, VERSION } from "@/constants";
import { useServerT } from "@/hooks";

/**
 * The footer component.
 * It is used in layout.tsx.
 * @returns
 */
export const Footer: React.FC = async () => {
    const params = await searchParams();
    const { t } = await useServerT(params);

    const generateLinkWithParams = (path: string) => {
        const newParams = new URLSearchParams(params);
        newParams.forEach((_, key) => {
            if (key.startsWith("_")) {
                newParams.delete(key);
            }
        });
        return `${path}?${newParams.toString()}`;
    };

    return (
        <footer className="mt-auto border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex flex-col items-center py-4 space-y-2">
                <nav className="flex items-center space-x-4">
                    <Link
                        href={generateLinkWithParams("/")}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {t("footer.home")}
                    </Link>
                    <Separator orientation="vertical" className="h-4" />
                    <Link
                        href={generateLinkWithParams("/terms-and-privacy")}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {t("footer.terms")}
                    </Link>
                </nav>
                <div className="text-xs text-muted-foreground">
                    {VERSION} © {new Date().getFullYear()}{" "}
                    <Link
                        href={AUTHOR_GITHUB}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {AUTHOR_NAME}
                    </Link>
                </div>
            </div>
        </footer>
    );
};
