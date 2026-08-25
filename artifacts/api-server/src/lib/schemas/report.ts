import { z } from "zod";
export const reportType = z.enum(["spam","harassment","hate","nudity","misinformation","other"]);
export const createReport = z.object({
  targetType: z.enum(["user","post","comment","message","story"]),
  targetId: z.string().uuid(),
  type: reportType,
  note: z.string().trim().max(1000).optional(),
});
