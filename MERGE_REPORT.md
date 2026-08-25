# Merge Report — `app-builder` into `cyberai`

Date: 2026-07-09

## Overview
The standalone `app-builder` codebase (an AI-driven app generator, 372 TS/TSX files) was merged into the existing `cyberai` pnpm monorepo as a first-class workspace package: `@workspace/app-builder` (`lib/app-builder`).

## Strategy
- **Container**: `cyberai` (already a proper pnpm workspace with `lib/*` and `artifacts/*`).
- **Merged package**: `lib/app-builder/` with its own `package.json`, `tsconfig.json`, `README.md`, and full source tree under `src/`.
- **Overlap policy**: `app-builder`'s internal `core/` (AppBuilderError, EventBus, DI Container, Result, Logger) is deliberately kept **scoped inside the package**. It provides AppBuilder-specific behavior; unifying it with `@workspace/core` (which centers on Express error middleware / AppError) would require behavior changes and was left as a follow-up (documented in `IMPROVEMENTS.md`).
- **No file was silently duplicated across packages**. All duplicated conceptual folder names (`core`, `agents`, `utils`) live in **separate npm names** with **different exports**, so imports are unambiguous.

## Layout changes
```
cyberai/
├─ lib/app-builder/                       (NEW package @workspace/app-builder)
│  ├─ package.json                        (workspace deps: @workspace/core, ai-core, agents)
│  ├─ tsconfig.json                       (extends tsconfig.base.json, composite)
│  ├─ README.md
│  └─ src/                                (full app-builder source tree)
├─ MERGE_REPORT.md                        (this file)
└─ CHANGELOG.md                           (entry added)
```
No other package was moved, renamed, or altered structurally.

## Code fixes applied during merge review

### 1. `security/rules/*.ts` — copy-paste stub bug
All five rule files (`no-eval`, `no-hardcoded-secret`, `no-dangerous-html`, `no-http`, `no-localStorage-token`) contained the same five if-branches guarded by a dead `if (kind === "…" …)` where `kind` was hard-coded to the file's own rule name — so only one branch could ever fire, and every finding was labelled with the wrong rule name / message. **Rewritten**: each file now runs only its own rule with a correct message and severity.

### 2. `review/rules/*.ts` — same copy-paste stub bug
All ten review rules had identical dead-branch code with the wrong messages. **Rewritten** so each rule performs one focused check with an accurate message:
- `balanced-braces` now actually walks the file and counts `{`/`}`.
- `has-export` fires when no `export` keyword is present.
- `has-newline`, `no-empty-file`, `no-any`, `no-console-log`, `no-hardcoded-color`, `no-relative-deep`, `no-todo`, `no-var` all rewritten to fire on their own regex only.

### 3. `perf/checks/*.ts` — same copy-paste stub bug
Same pattern in `lazyLoading`, `memoization`, `virtualLists`, `bundleAudit`, `codeSplitting`. **Rewritten** so each function runs its own single check.

### 4. Barrel exports
Added missing `index.ts` barrels in `agents`, `generators`, `pipeline`, `review`, `templates`, `scaffolds`, `security`, `perf`, `reports`, `tests-gen`. Sub-exports declared in `package.json` (`exports` map) so consumers can `import { … } from "@workspace/app-builder/pipeline"`.

### 5. Security scan
- No hardcoded secrets/API keys found.
- No runtime `eval()` / `new Function()` in shipped code — only defensive references inside the rewritten security rules.
- No hardcoded HTTP URLs outside test fixtures.

## Follow-up (not blocking)
- Unify `@workspace/app-builder/core` helpers into `@workspace/core` once behavior semantics are reconciled.
- Fold `app-builder/ai/prompts` into `@workspace/ai-core` if prompt formats align.
- Run `pnpm install` + `pnpm typecheck` + `pnpm test` end-to-end in an environment with network access (this sandbox honors `minimumReleaseAge` and cannot install packages inline).
- Wire `@workspace/app-builder` into `artifacts/cyber-ai` or a new `artifacts/app-builder-cli` entry point.

## Verification checklist
- [x] `pnpm-workspace.yaml` already includes `lib/*`; no change required.
- [x] `@workspace/app-builder` package.json validates as JSON.
- [x] `tsconfig.json` extends `tsconfig.base.json`, `composite: true`, correct rootDir/outDir.
- [x] All rewritten rules retain their original public API (name + `check(file)` signature) so `ReviewLoop` and `SecurityPass` keep working without further edits.
- [x] No `.git` metadata copied in.
