import { z } from "zod";
import { FileList } from "./common";
export const formSchema = FileList.extend({
  kind: z.literal("form"),
  notes: z.string().nullable(),
});
export type FormOutput = z.infer<typeof formSchema>;
