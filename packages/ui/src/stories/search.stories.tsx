import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../components/command";
import MultipleSelector, { type Option } from "../components/multi-select";
import { CatalogItem, CatalogSection } from "./_shared";

const options: Option[] = [
  { value: "liked", label: "Liked songs" },
  { value: "watch-later", label: "Watch later" },
  { value: "favorites", label: "Favorites" },
];

const meta = {
  title: "Components/Search and selection",
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Catalog: Story = {
  render: () => (
    <CatalogSection title="Search and multi-select">
      <div className="grid gap-4 lg:grid-cols-2">
        <CatalogItem title="Command">
          <Command className="border">
            <CommandInput placeholder="Search command" />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Actions">
                <CommandItem>Copy playlist</CommandItem>
                <CommandItem>Merge playlists</CommandItem>
                <CommandItem>Extract tracks</CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </CatalogItem>
        <CatalogItem title="Multi select">
          <MultipleSelector
            defaultOptions={options}
            placeholder="Select playlists"
            className="w-full"
          />
        </CatalogItem>
      </div>
    </CatalogSection>
  ),
};
