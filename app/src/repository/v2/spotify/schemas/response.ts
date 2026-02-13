import { z } from "zod";

export function createPaginatedResponse<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    href: z.string().url(),
    items: z.array(itemSchema),
    limit: z.number().int().positive(),
    next: z.string().url().nullable(),
    offset: z.number().int().nonnegative(),
    previous: z.string().url().nullable(),
    total: z.number().int().nonnegative(),
  });
}

export type PaginatedResponse<T> = {
  href: string;
  items: T[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
};

export const SnapshotResponse = z.object({
  snapshot_id: z.string(),
});

export type SnapshotResponse = z.infer<typeof SnapshotResponse>;
