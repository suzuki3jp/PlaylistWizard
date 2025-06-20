import type { ProviderRepositoryType } from "@/repository/providers/factory";
import type { TFunction } from "i18next";

export interface SSRProps {
  params: Promise<Record<string, string>>;
}
export interface PageProps extends SSRProps {
  searchParams: Promise<Record<string, string>>;
}

export interface LayoutProps extends SSRProps {
  children: React.ReactNode;
}

export interface WithCredentials {
  accessToken: string;
  provider: ProviderRepositoryType;
}

// biome-ignore lint/complexity/noBannedTypes: <explanation>
export type WithT<T = {}> = T & { t: TFunction };
