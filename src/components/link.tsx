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
}) => {
    return (
        <NextLink
            href={href}
            target={isOpenInNewTab ? "_blank" : undefined}
            className={className}
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
    }>
>;
