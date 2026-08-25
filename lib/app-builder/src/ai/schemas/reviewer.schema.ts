import { z } from "zod";
import { FileList } from "./common";
export const reviewerSchema = FileList.extend({
  kind: z.literal("reviewer"),
  notes: z.string().nullable(),
});
export type ReviewerOutput = z.infer<typeof reviewerSchema>;
