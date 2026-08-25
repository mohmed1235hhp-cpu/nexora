import { z } from "zod";
import { FileList } from "./common";
export const logicSchema = FileList.extend({
  kind: z.literal("logic"),
  notes: z.string().nullable(),
});
export type LogicOutput = z.infer<typeof logicSchema>;
