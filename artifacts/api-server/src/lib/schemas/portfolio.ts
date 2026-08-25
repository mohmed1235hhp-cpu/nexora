import { z } from "zod";
export const createPortfolioItem = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
  categoryId: z.string().uuid().optional(),
  mediaIds: z.array(z.string().uuid()).max(10).default([]),
  isPublic: z.boolean().default(true),
});
export const updatePortfolioItem = createPortfolioItem.partial();
