import type { TFunction } from "i18next";

export interface SSRProps {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}

export interface LayoutProps extends SSRProps {
  children: React.ReactNode;
}

// biome-ignore lint/complexity/noBannedTypes: <explanation>
export type WithT<T = {}> = T & { t: TFunction };
