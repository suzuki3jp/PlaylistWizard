import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/accordion";
import { Separator } from "../components/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/tabs";
import { CatalogItem, CatalogSection } from "./_shared";

const meta = {
  title: "Components/Navigation",
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Catalog: Story = {
  render: () => (
    <CatalogSection title="Navigation components">
      <div className="grid gap-4 lg:grid-cols-2">
        <CatalogItem title="Tabs">
          <Tabs defaultValue="playlists" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="playlists">Playlists</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="playlists" className="text-sm">
              Playlist tools
            </TabsContent>
            <TabsContent value="settings" className="text-sm">
              Account settings
            </TabsContent>
          </Tabs>
        </CatalogItem>
        <CatalogItem title="Accordion">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>What does it sync?</AccordionTrigger>
              <AccordionContent>
                Playlist metadata and selected playlist actions.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CatalogItem>
        <CatalogItem title="Separator">
          <div className="w-full space-y-3">
            <div className="text-sm">Section A</div>
            <Separator />
            <div className="text-sm">Section B</div>
          </div>
        </CatalogItem>
      </div>
    </CatalogSection>
  ),
};
