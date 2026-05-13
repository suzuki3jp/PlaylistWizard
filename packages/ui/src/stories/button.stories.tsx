import type { Meta, StoryObj } from "@storybook/react-vite";
import { DownloadIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "../components/button";
import { CatalogGrid, CatalogItem, CatalogSection } from "./_shared";

const meta = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  args: {
    children: "Button",
    variant: "default",
    size: "default",
  },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "destructive",
        "outline",
        "secondary",
        "ghost",
        "link",
      ],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <CatalogSection title="Button variants">
      <CatalogGrid>
        <CatalogItem title="Default">
          <Button>Default</Button>
        </CatalogItem>
        <CatalogItem title="Secondary">
          <Button variant="secondary">Secondary</Button>
        </CatalogItem>
        <CatalogItem title="Outline">
          <Button variant="outline">Outline</Button>
        </CatalogItem>
        <CatalogItem title="Ghost">
          <Button variant="ghost">Ghost</Button>
        </CatalogItem>
        <CatalogItem title="Destructive">
          <Button variant="destructive">
            <Trash2Icon />
            Delete
          </Button>
        </CatalogItem>
        <CatalogItem title="Link">
          <Button variant="link">Open details</Button>
        </CatalogItem>
      </CatalogGrid>
    </CatalogSection>
  ),
};

export const Sizes: Story = {
  render: () => (
    <CatalogSection title="Button sizes">
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm">
          <PlusIcon />
          Small
        </Button>
        <Button>Default</Button>
        <Button size="lg">
          <DownloadIcon />
          Large
        </Button>
        <Button size="icon" aria-label="Add item">
          <PlusIcon />
        </Button>
      </div>
    </CatalogSection>
  ),
};
