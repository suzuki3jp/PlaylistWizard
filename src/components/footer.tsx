import type { WithT } from "@/@types";
import { Link } from "@/components/link";
import { GITHUB_REPO } from "@/constants";

export interface FooterProps extends WithT {}

export async function Footer({ t }: FooterProps) {
    return (
        <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-gray-800 bg-gray-950">
            <p className="text-xs text-gray-400">
                © {new Date().getFullYear()} suzuki3jp All rights reserved.
            </p>
            <nav className="sm:ml-auto flex gap-4 sm:gap-6">
                <Link
                    className="text-xs text-gray-400 hover:text-white hover:underline underline-offset-4"
                    href="/terms-and-privacy"
                >
                    {t("footer.terms")}
                </Link>
                <Link
                    className="text-xs text-gray-400 hover:text-white hover:underline underline-offset-4"
                    href={`${GITHUB_REPO}/issues`}
                >
                    {t("footer.contact")}
                </Link>
            </nav>
        </footer>
    );
}
