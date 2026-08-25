/**
 * Phase-2 aggregate entry.
 *
 * Uses namespace re-exports (`export * as X`) for subtrees whose internal
 * names collide across siblings (e.g. `templates` re-exports `mobile`,
 * `pwa`, `desktop`, etc.). The primary `.` entry is `./index.ts`; this
 * file is exposed via the `"./phase2"` subpath export.
 *
 * `tests-gen` is intentionally excluded — it is a test-artifact generator
 * that is not part of the compiled library surface. Use the package's own
 * `vitest` config to consume it in tests.
 */
export * from "./ai";
export * from "./agents";
export * as generators from "./generators";
export * as templates from "./templates";
export * as pipeline from "./pipeline";
export * as review from "./review";
export * as scaffolds from "./scaffolds";
export * as security from "./security";
export * as perf from "./perf";
export * as reports from "./reports";
