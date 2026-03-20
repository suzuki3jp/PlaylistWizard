import { z } from "zod";

export const PageInfo = z.object({
  totalResults: z.number().int().nonnegative(),
  resultsPerPage: z.number().int().positive(),
});

export function createListResponse<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    kind: z.string(),
    etag: z.string(),
    nextPageToken: z.string().optional(),
    prevPageToken: z.string().optional(),
    pageInfo: PageInfo,
    items: z.array(itemSchema),
  });
}

export type ListResponse<T> = {
  kind: string;
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo: z.infer<typeof PageInfo>;
  items: T[];
};
