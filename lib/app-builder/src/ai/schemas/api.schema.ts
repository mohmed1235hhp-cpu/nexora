import { z } from "zod";
import { FileList } from "./common";
export const apiSchema = FileList.extend({
  kind: z.literal("api"),
  notes: z.string().nullable(),
});
export type ApiOutput = z.infer<typeof apiSchema>;
