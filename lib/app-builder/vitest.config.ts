import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/tests/**/*.test.ts"],
    exclude: ["src/tests/e2e/**"],
    environment: "node",
    globals: false,
    passWithNoTests: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/tests/**",
        "src/tests-gen/**",
        "**/*.d.ts",
        "**/index.ts",
      ],
    },
  },
});
