import { z } from "zod";
import { FileList } from "./common";
export const stateSchema = FileList.extend({
  kind: z.literal("state"),
  notes: z.string().nullable(),
});
export type StateOutput = z.infer<typeof stateSchema>;
