"use client";

import {
  BookOpen,
  Github,
  Home,
  Layers,
  ListMusic,
  type LucideIcon,
  Mail,
  ScrollText,
  Shield,
} from "lucide-react";
import NextLink from "next/link";
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
} from "@/components/ui/sidebar";
import { urls } from "@/constants";
import { useLang } from "@/features/localization/atoms/lang";
import { isExternalLink } from "@/lib/link";
import { useT } from "@/presentation/hooks/t/client";
import { useAuth } from "@/presentation/hooks/useAuth";

interface LinkItem {
  Icon: LucideIcon;
  label: string;
  href: string;
}

function useLinkGroups(): { mainLinks: LinkItem[][]; footerLinks: LinkItem[] } {
  const { t } = useT();
  const [lang] = useLang();
  const auth = useAuth();

  return {
    mainLinks: [
      [
        { Icon: Home, label: t("header.home"), href: urls.home(lang) },
        {
          Icon: ListMusic,
          label: t("header.playlists"),
          href: auth ? urls.playlists() : urls.signIn(lang, urls.playlists()),
        },
        {
          Icon: Layers,
          label: t("header.structured-playlists"),
          href: auth
            ? urls.structuredPlaylistsEditor(lang)
            : urls.signIn(lang, urls.structuredPlaylistsEditor(lang)),
        },
      ],
      [
        {
          Icon: Github,
          label: t("footer.links.github"),
          href: urls.GITHUB_REPO,
        },
        {
          Icon: BookOpen,
          label: t("footer.links.changelog"),
          href: `${urls.GITHUB_REPO}/blob/main/app/CHANGELOG.md`,
        },
      ],
    ],
    footerLinks: [
      {
        Icon: ScrollText,
        label: t("footer.legal.terms"),
        href: urls.terms(lang),
      },
      {
        Icon: Shield,
        label: t("footer.legal.privacy"),
        href: urls.privacy(lang),
      },
      {
        Icon: Mail,
        label: t("footer.legal.contact"),
        href: urls.GITHUB_ISSUES,
      },
    ],
  };
}

export function AppSidebar({ className }: { className?: string }) {
  const { isMobile, setOpenMobile } = useSidebar();
  const { mainLinks, footerLinks } = useLinkGroups();

  function handleLinkClick() {
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  return (
    <Sidebar className={className}>
      <SidebarContent className="mt-6 px-6">
        {mainLinks.map((group, index) => (
          <div key={`${group[0].label}-group-${index}`}>
            <SidebarGroup>
              <SidebarMenu>
                {group.map(({ Icon, label, href }) => (
                  <SidebarMenuLinkItem
                    key={label}
                    Icon={Icon}
                    label={label}
                    href={href}
                    handleClick={handleLinkClick}
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

      <SidebarFooter className="px-6">
        <SidebarSeparator />
        <SidebarMenu>
          {footerLinks.map(({ Icon, label, href }) => (
            <SidebarMenuLinkItem
              key={label}
              Icon={Icon}
              label={label}
              href={href}
              handleClick={handleLinkClick}
            />
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function SidebarMenuLinkItem({
  Icon,
  label,
  href,
  handleClick,
}: {
  Icon: LucideIcon;
  label: string;
  href: string;
  handleClick: () => void;
}) {
  const isExternal = isExternalLink(href, window.location.origin);
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild size="lg" onClick={handleClick}>
        <NextLink href={href} target={isExternal ? "_blank" : undefined}>
          <div className="flex size-8 items-center justify-center">
            <Icon size={20} />
          </div>
          <span>{label}</span>
        </NextLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
