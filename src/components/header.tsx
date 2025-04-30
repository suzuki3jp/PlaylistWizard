import Link from "next/link";

import type { WithT } from "@/@types";
import { Button } from "@/components/ui/button";
import Icon from "@/images/icon.png";
import Image from "next/image";
import { AuthButton } from "./auth-button";

export type HeaderProps = WithT & { lang: string };

export function Header({ t, lang }: HeaderProps) {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-950">
            <div className="container px-4 flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
                <Link href="/">
                    <div className="flex gap-2 items-center text-xl font-bold text-white">
                        <div className="relative w-8 h-8">
                            <Image
                                src={Icon}
                                width={32}
                                height={32}
                                alt="PlaylistWizard logo"
                            />
                        </div>
                        PlaylistWizard
                    </div>
                </Link>
                <div className="flex flex-1 items-center justify-end space-x-4">
                    <nav className="flex items-center space-x-6">
                        <Link
                            href="/#features"
                            className="text-sm font-medium text-white hover:text-pink-400"
                        >
                            {t("header.features")}
                        </Link>
                        <AuthButton lang={lang} />
                    </nav>
                </div>
            </div>
        </header>
    );
}
