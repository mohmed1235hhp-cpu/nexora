import { z } from "zod";
export const idParam = z.object({ id: z.string().uuid() });
export const cursorPagination = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export const searchQuery = z.object({
  q: z.string().trim().min(1).max(200),
  ...cursorPagination.shape,
});
