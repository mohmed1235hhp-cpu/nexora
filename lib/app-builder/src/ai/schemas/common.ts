import { z } from "zod";
export const FileArtifact = z.object({
  path: z.string(),
  content: z.string(),
  language: z.string().nullable(),
});
export type FileArtifact = z.infer<typeof FileArtifact>;
export const FileList = z.object({ files: z.array(FileArtifact) });
export type FileList = z.infer<typeof FileList>;
