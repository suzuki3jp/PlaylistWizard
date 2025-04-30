import NextLink, { type LinkProps as NextLinkProps } from "next/link";

export interface LinkProps extends NextLinkProps {
    openInNewTab?: boolean;
    underline?: boolean;
    children?: React.ReactNode;
}

/**
 * A wrapper around the Next.js Link component.
 */
export function Link(props: LinkProps) {
    return (
        <NextLink
            {...props}
            target={props.openInNewTab ? "_blank" : undefined}
            className={props.underline ? "underline" : undefined}
        >
            {props.children}
        </NextLink>
    );
}
