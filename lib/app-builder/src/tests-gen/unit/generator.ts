import type { FileArtifact } from "../../ai/schemas/common";

export function generateUnitTests(files: FileArtifact[]): FileArtifact[] {
  return files
    .filter((f) => f.path.endsWith(".ts") || f.path.endsWith(".tsx"))
    .slice(0, 20)
    .map((f) => {
      const base = f.path.replace(/\.tsx?$/, "");
      return {
        path: `${base}.unit.test.ts`,
        language: "ts",
        content: `import { describe, it, expect } from "vitest";\n` +
          `describe("unit: ${base}", () => {\n` +
          `  it("smoke", () => { expect(true).toBe(true); });\n` +
          `});\n`,
      };
    });
}
