import { z } from "zod";
import { FileList } from "./common";
export const validationSchema = FileList.extend({
  kind: z.literal("validation"),
  notes: z.string().nullable(),
});
export type ValidationOutput = z.infer<typeof validationSchema>;
