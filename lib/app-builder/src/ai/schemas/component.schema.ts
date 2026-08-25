import { z } from "zod";
import { FileList } from "./common";
export const componentSchema = FileList.extend({
  kind: z.literal("component"),
  notes: z.string().nullable(),
});
export type ComponentOutput = z.infer<typeof componentSchema>;
