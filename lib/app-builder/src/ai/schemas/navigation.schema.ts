import { z } from "zod";
import { FileList } from "./common";
export const navigationSchema = FileList.extend({
  kind: z.literal("navigation"),
  notes: z.string().nullable(),
});
export type NavigationOutput = z.infer<typeof navigationSchema>;
