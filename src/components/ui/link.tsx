import { cn } from "@/lib/utils";
import NextLink from "next/link";
import type React from "react";

/**
 * The link component.
 * It is using next/link to navigate to the given href.
 * It can open the link in a new tab.
 * @param param0
 * @returns
 */
export const Link: React.FC<LinkProps> = ({
    children,
    href,
    className,
    isOpenInNewTab = false,
    underline = false,
    onClick,
}) => {
    return (
        <NextLink
            href={href}
            target={isOpenInNewTab ? "_blank" : undefined}
            className={cn(underline ? "underline" : undefined, className)}
            onClick={onClick}
        >
            {children}
        </NextLink>
    );
};

export type LinkProps = Readonly<
    React.PropsWithChildren<{
        href: string;
        className?: string;
        isOpenInNewTab?: boolean;
        underline?: boolean;
        onClick?: () => void;
    }>
>;
