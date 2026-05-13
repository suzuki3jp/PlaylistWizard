"use client";

import { type LucideIcon, Menu, X } from "lucide-react";
import type * as React from "react";

import { cn } from "../lib/cn";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "./sidebar";

export interface SidebarNavigationItem {
  Icon: LucideIcon;
  label: string;
  href: string;
  openInNewTab?: boolean;
}

export type SidebarNavigationLinkProps =
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    openInNewTab?: boolean;
  };

export interface SidebarNavigationProps {
  className?: string;
  mainLinks: SidebarNavigationItem[][];
  footerLinks?: SidebarNavigationItem[];
  LinkComponent?: React.ComponentType<SidebarNavigationLinkProps>;
}

export function SidebarNavigation({
  className,
  mainLinks,
  footerLinks = [],
  LinkComponent = DefaultSidebarLink,
}: SidebarNavigationProps) {
  const { isMobile, setOpenMobile } = useSidebar();

  function handleLinkClick() {
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  return (
    <Sidebar className={className}>
      <SidebarContent className="mt-6 px-6">
        {mainLinks.map((group, index) => (
          <div key={group.map((item) => item.label).join("-")}>
            <SidebarGroup>
              <SidebarMenu>
                {group.map((item) => (
                  <SidebarNavigationLinkItem
                    key={item.label}
                    item={item}
                    LinkComponent={LinkComponent}
                    onClick={handleLinkClick}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroup>
            {index < mainLinks.length - 1 && (
              <SidebarSeparator className="my-5" />
            )}
          </div>
        ))}
      </SidebarContent>

      {footerLinks.length > 0 && (
        <SidebarFooter className="px-6">
          <SidebarSeparator />
          <SidebarMenu>
            {footerLinks.map((item) => (
              <SidebarNavigationLinkItem
                key={item.label}
                item={item}
                LinkComponent={LinkComponent}
                onClick={handleLinkClick}
              />
            ))}
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}

function SidebarNavigationLinkItem({
  item,
  LinkComponent,
  onClick,
}: {
  item: SidebarNavigationItem;
  LinkComponent: React.ComponentType<SidebarNavigationLinkProps>;
  onClick: () => void;
}) {
  const { Icon, label, href, openInNewTab } = item;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild size="lg" onClick={onClick}>
        <LinkComponent href={href} openInNewTab={openInNewTab}>
          <div className="flex size-8 items-center justify-center">
            <Icon size={20} />
          </div>
          <span>{label}</span>
        </LinkComponent>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function DefaultSidebarLink({
  href,
  openInNewTab,
  children,
  ...props
}: SidebarNavigationLinkProps) {
  return (
    <a
      href={href}
      target={openInNewTab ? "_blank" : undefined}
      rel={openInNewTab ? "noreferrer" : undefined}
      {...props}
    >
      {children}
    </a>
  );
}

export function SidebarToggleButton({
  className,
  onClick,
  ...props
}: React.ComponentProps<"button">) {
  const { state, isMobile, toggleSidebar } = useSidebar();
  const isExpanded = !isMobile && state === "expanded";

  return (
    <button
      type="button"
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      className={cn(
        "relative inline-flex size-8 cursor-pointer items-center justify-center text-gray-400 hover:text-white",
        className,
      )}
      aria-label="Toggle sidebar"
      {...props}
    >
      <Menu
        className={cn(
          "absolute size-5 transition-all duration-200",
          isExpanded
            ? "rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100",
        )}
      />
      <X
        className={cn(
          "absolute size-5 transition-all duration-200",
          isExpanded
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-0 opacity-0",
        )}
      />
    </button>
  );
}
