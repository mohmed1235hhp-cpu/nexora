import { z } from "zod";
import { FileList } from "./common";
export const screenSchema = FileList.extend({
  kind: z.literal("screen"),
  notes: z.string().nullable(),
});
export type ScreenOutput = z.infer<typeof screenSchema>;
