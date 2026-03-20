"use client";

import { Menu, X } from "lucide-react";
import NextLink from "next/link";
import { PlaylistWizardLogo } from "@/components/playlistwizard-log";
import { useSidebar } from "@/components/ui/sidebar";
import { urls } from "@/constants";
import { useLang } from "@/features/localization/atoms/lang";

export function HeaderNavSection() {
  const { state, isMobile, toggleSidebar } = useSidebar();
  const [lang] = useLang();

  const isExpanded = !isMobile && state === "expanded";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleSidebar}
        className="relative inline-flex size-8 cursor-pointer items-center justify-center text-gray-400 hover:text-white"
        aria-label="Toggle sidebar"
      >
        <Menu
          className={`absolute size-5 transition-all duration-200 ${
            isExpanded
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100"
          }`}
        />
        <X
          className={`absolute size-5 transition-all duration-200 ${
            isExpanded
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0"
          }`}
        />
      </button>

      <NextLink
        href={urls.home(lang)}
        className="flex items-center gap-2 font-bold text-white text-xl"
      >
        <PlaylistWizardLogo size={32} />
        <span className={isMobile ? "hidden" : "block"}>PlaylistWizard</span>
      </NextLink>
    </div>
  );
}
