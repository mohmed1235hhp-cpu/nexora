import { z } from "zod";
import { FileList } from "./common";
export const assetsSchema = FileList.extend({
  kind: z.literal("assets"),
  notes: z.string().nullable(),
});
export type AssetsOutput = z.infer<typeof assetsSchema>;
