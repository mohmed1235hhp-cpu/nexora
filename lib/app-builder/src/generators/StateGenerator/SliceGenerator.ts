import type { FileArtifact } from "../../ai/schemas/common";
import type { GenerateInput, GenerateResult } from "../types";

export class SliceGenerator {
  readonly name = "SliceGenerator";
  async generate(input: GenerateInput): Promise<GenerateResult> {
    input.ctx.log("info", `[${this.name}] generating`);
    // Real generation is delegated to the corresponding AI agent via the pipeline.
    // This class shapes the spec and post-processes agent output.
    return { generator: this.name, files: [], warnings: [] };
  }

  postProcess(files: FileArtifact[]): FileArtifact[] {
    return files.map((f) => ({ ...f, content: f.content.trimEnd() + "\n" }));
  }
}
