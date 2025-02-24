"use client";
import { Button } from "@/components/shadcn-ui/button";
import { Link } from "@/components/ui/link";
import { SOURCE_CODE_GITHUB } from "@/constants";
import { useT } from "@/hooks";
import { GitHub as GitHubIcon } from "@mui/icons-material";

export const GithubButton = () => {
    const { t } = useT();

    return (
        <div className="hidden md:block">
            <Link href={SOURCE_CODE_GITHUB} isOpenInNewTab>
                <Button
                    variant="ghost"
                    size="icon"
                    title={t("header.github-link-tooltip")}
                >
                    <GitHubIcon />
                </Button>
            </Link>
        </div>
    );
};
