import { z } from "zod";
import { FileList } from "./common";
export const fixerSchema = FileList.extend({
  kind: z.literal("fixer"),
  notes: z.string().nullable(),
});
export type FixerOutput = z.infer<typeof fixerSchema>;
