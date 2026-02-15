"use client";

import type { PropsWithChildren } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/features/side-menu";

export function SidebarLayout({ children }: PropsWithChildren) {
  return (
    <SidebarProvider
      defaultOpen={true}
      style={{ "--sidebar-width": "300px" } as React.CSSProperties}
    >
      <AppSidebar className="top-16 z-30 h-[calc(100svh-4rem)]" />
      <SidebarInset className="block bg-transparent pt-16">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
