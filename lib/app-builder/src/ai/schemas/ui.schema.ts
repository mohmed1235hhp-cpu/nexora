import { z } from "zod";
import { FileList } from "./common";
export const uiSchema = FileList.extend({
  kind: z.literal("ui"),
  notes: z.string().nullable(),
});
export type UiOutput = z.infer<typeof uiSchema>;
