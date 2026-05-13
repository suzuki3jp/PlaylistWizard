import type { Meta, StoryObj } from "@storybook/react-vite";
import { SearchIcon } from "lucide-react";
import { Checkbox } from "../components/checkbox";
import { Input } from "../components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/select";
import { Switch } from "../components/switch";
import { Textarea } from "../components/textarea";
import { CatalogGrid, CatalogItem, CatalogSection } from "./_shared";

const meta = {
  title: "Components/Form controls",
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Catalog: Story = {
  render: () => (
    <CatalogSection
      title="Form controls"
      description="Inputs, selection controls, and text entry components."
    >
      <CatalogGrid>
        <CatalogItem title="Input">
          <Input placeholder="Playlist name" />
        </CatalogItem>
        <CatalogItem title="Input with icon">
          <div className="relative w-full">
            <SearchIcon className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search playlists" />
          </div>
        </CatalogItem>
        <CatalogItem title="Textarea">
          <Textarea placeholder="Describe this action" />
        </CatalogItem>
        <CatalogItem title="Checkbox">
          <div className="flex items-center gap-2 text-sm">
            <Checkbox defaultChecked />
            <span>Allow duplicates</span>
          </div>
        </CatalogItem>
        <CatalogItem title="Switch">
          <div className="flex items-center gap-2 text-sm">
            <Switch defaultChecked />
            <span>Enabled</span>
          </div>
        </CatalogItem>
        <CatalogItem title="Select">
          <Select defaultValue="youtube">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="youtube-music">YouTube Music</SelectItem>
              <SelectItem value="local">Local</SelectItem>
            </SelectContent>
          </Select>
        </CatalogItem>
      </CatalogGrid>
    </CatalogSection>
  ),
};
