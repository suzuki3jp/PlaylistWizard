import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar, AvatarFallback, AvatarImage } from "../components/avatar";
import { Badge } from "../components/badge";
import { Progress } from "../components/progress";
import { Skeleton } from "../components/skeleton";
import { CatalogGrid, CatalogItem, CatalogSection } from "./_shared";

const meta = {
  title: "Components/Feedback",
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Catalog: Story = {
  render: () => (
    <CatalogSection title="Feedback components">
      <CatalogGrid>
        <CatalogItem title="Badge">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Error</Badge>
          <Badge variant="outline">Outline</Badge>
        </CatalogItem>
        <CatalogItem title="Avatar">
          <Avatar>
            <AvatarImage src="/assets/unknown-user.png" alt="User" />
            <AvatarFallback>PW</AvatarFallback>
          </Avatar>
        </CatalogItem>
        <CatalogItem title="Progress">
          <Progress value={62} className="w-full" />
        </CatalogItem>
        <CatalogItem title="Skeleton">
          <div className="w-full space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CatalogItem>
      </CatalogGrid>
    </CatalogSection>
  ),
};
