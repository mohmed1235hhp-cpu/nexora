import { z } from "zod";
import { FileList } from "./common";
export const listSchema = FileList.extend({
  kind: z.literal("list"),
  notes: z.string().nullable(),
});
export type ListOutput = z.infer<typeof listSchema>;
