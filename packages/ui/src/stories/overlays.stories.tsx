import type { Meta, StoryObj } from "@storybook/react-vite";
import { MoreHorizontalIcon } from "lucide-react";
import { Button } from "../components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../components/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/tooltip";
import { CatalogGrid, CatalogItem, CatalogSection } from "./_shared";

const meta = {
  title: "Components/Overlays",
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Catalog: Story = {
  render: () => (
    <CatalogSection title="Overlay components">
      <CatalogGrid>
        <CatalogItem title="Dialog">
          <Dialog>
            <DialogTrigger asChild>
              <Button>Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create playlist</DialogTitle>
                <DialogDescription>
                  Confirm the details before creating a playlist.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CatalogItem>
        <CatalogItem title="Sheet">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary">Open sheet</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Action queue</SheetTitle>
                <SheetDescription>
                  Review queued playlist actions.
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </CatalogItem>
        <CatalogItem title="Dropdown menu">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu">
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CatalogItem>
        <CatalogItem title="Tooltip">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost">Hover me</Button>
              </TooltipTrigger>
              <TooltipContent>Runs the selected action.</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CatalogItem>
      </CatalogGrid>
    </CatalogSection>
  ),
};
