export interface SSRProps {
  params: Promise<Record<string, string>>;
}

export interface LayoutProps extends SSRProps {
  children: React.ReactNode;
}

export interface PageProps extends SSRProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}
