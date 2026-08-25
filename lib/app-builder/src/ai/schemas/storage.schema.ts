import { z } from "zod";
import { FileList } from "./common";
export const storageSchema = FileList.extend({
  kind: z.literal("storage"),
  notes: z.string().nullable(),
});
export type StorageOutput = z.infer<typeof storageSchema>;
