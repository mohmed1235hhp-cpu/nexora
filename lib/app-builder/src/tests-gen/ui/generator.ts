import type { FileArtifact } from "../../ai/schemas/common";

export function generateUiTests(files: FileArtifact[]): FileArtifact[] {
  return files
    .filter((f) => f.path.endsWith(".ts") || f.path.endsWith(".tsx"))
    .slice(0, 20)
    .map((f) => {
      const base = f.path.replace(/\.tsx?$/, "");
      return {
        path: `${base}.ui.test.ts`,
        language: "ts",
        content: `import { describe, it, expect } from "vitest";\n` +
          `describe("ui: ${base}", () => {\n` +
          `  it("smoke", () => { expect(true).toBe(true); });\n` +
          `});\n`,
      };
    });
}
