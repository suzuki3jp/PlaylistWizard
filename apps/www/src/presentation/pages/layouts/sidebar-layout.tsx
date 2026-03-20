"use client";

import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DEFAULT_CLOSE_SIDEBAR_ROUTES } from "@/constants";
import { AppSidebar } from "@/features/side-menu";

export function SidebarLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();

  return (
    <SidebarProvider
      defaultOpen={!DEFAULT_CLOSE_SIDEBAR_ROUTES.includes(pathname)}
      style={{ "--sidebar-width": "300px" } as React.CSSProperties}
    >
      <AppSidebar className="top-16 z-30 h-[calc(100svh-4rem)]" />
      <SidebarInset className="block bg-transparent pt-16">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
