import { z } from "zod";
import { FileList } from "./common";
export const layoutSchema = FileList.extend({
  kind: z.literal("layout"),
  notes: z.string().nullable(),
});
export type LayoutOutput = z.infer<typeof layoutSchema>;
