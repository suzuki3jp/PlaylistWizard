import type { Meta, StoryObj } from "@storybook/react-vite";
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
import { SidebarInset, SidebarProvider } from "../components/sidebar";
import {
  SidebarNavigation,
  SidebarToggleButton,
} from "../components/sidebar-navigation";

const mainLinks: LinkItem[][] = [
  [
    { Icon: Home, label: "Home", href: "#" },
    { Icon: ListMusic, label: "Playlists", href: "#" },
    { Icon: Layers, label: "Structured playlists", href: "#" },
  ],
  [
    { Icon: Github, label: "GitHub", href: "#" },
    { Icon: BookOpen, label: "Changelog", href: "#" },
  ],
];

const footerLinks: LinkItem[] = [
  { Icon: ScrollText, label: "Terms", href: "#" },
  { Icon: Shield, label: "Privacy", href: "#" },
  { Icon: Mail, label: "Contact", href: "#" },
];

interface LinkItem {
  Icon: LucideIcon;
  label: string;
  href: string;
}

const meta = {
  title: "Components/Sidebar",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const PlaylistWizardLayout: Story = {
  render: () => (
    <div className="dark min-h-[640px] bg-background text-foreground">
      <SidebarProvider
        defaultOpen
        style={{ "--sidebar-width": "300px" } as React.CSSProperties}
      >
        <StoryHeader />
        <SidebarNavigation
          className="top-16 z-30 h-[calc(100svh-4rem)]"
          mainLinks={mainLinks}
          footerLinks={footerLinks}
        />
        <SidebarInset className="block bg-transparent pt-16">
          <main className="p-8">
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-lg">
              <p className="font-medium text-white">PlaylistWizard content</p>
              <p className="mt-2 text-gray-400 text-sm">
                This story mirrors the current app layout: fixed top header,
                300px sidebar width, animated menu/close trigger, grouped
                navigation, and footer legal links.
              </p>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  ),
};

function StoryHeader() {
  return (
    <div className="fixed top-0 right-0 left-0 z-50 border-gray-800 border-b bg-gray-950">
      <header className="flex h-16 items-center gap-4 px-4 md:px-6">
        <div className="flex items-center gap-2">
          <SidebarToggleButton />

          <div className="flex items-center gap-2 font-bold text-white text-xl">
            <div className="flex size-8 items-center justify-center rounded-md bg-pink-600 font-bold text-sm">
              PW
            </div>
            <span className="hidden md:block">PlaylistWizard</span>
          </div>
        </div>
      </header>
    </div>
  );
}
