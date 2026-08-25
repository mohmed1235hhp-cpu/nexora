import { z } from "zod";
export const updateProfile = z.object({
  displayName: z.string().trim().min(1).max(80).optional(),
  bio: z.string().trim().max(500).optional(),
  avatarUrl: z.string().url().max(500).optional(),
  location: z.string().trim().max(120).optional(),
  website: z.string().url().max(255).optional(),
});
