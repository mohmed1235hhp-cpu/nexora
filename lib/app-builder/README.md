# @workspace/app-builder

AI-driven application generator (mobile / PWA / desktop). Merged into the cyberai
monorepo as a first-class workspace package.

## Layout

```
src/
├─ index.ts / index.phase2.ts    entry points
├─ agents/                       AppBuilder-specific agents (UI, Nav, State, Logic, API,
│                                Storage, Validation, Assets, Reviewer, Fixer)
├─ ai/                           prompts + schemas used by generators
├─ generators/                   code generators (UI, Navigation, State, Logic, API,
│                                Storage, Validation, Assets)
├─ pipeline/                     multi-stage generation pipeline (stages, logs, status)
├─ review/                       static review rules + autofix
├─ templates/                    domain templates (crm, pos, restaurant, booking, ...)
├─ scaffolds/                    per-platform scaffolds (mobile, pwa, desktop)
├─ security/                     security rules injected into generated apps
├─ perf/                         perf checks
├─ reports/                      report formatters + templates
├─ tests/  tests-gen/            fixtures + generated tests
└─ (screens, navigation, providers, state, storage, hooks, components,
    theme, localization, assets, documentation, ...)
```

The generic pieces (`core`, `errors`, `logger`, `events`, `di`, `result`)
that overlap conceptually with `@workspace/core` are kept scoped to this
package to preserve the AppBuilder-specific classes (`AppBuilderError`, DI
container, event bus). If a future refactor wants to unify them, move
domain-neutral helpers into `@workspace/core` and re-export from here.

## Scripts

- `pnpm --filter @workspace/app-builder typecheck`
- `pnpm --filter @workspace/app-builder build`
- `pnpm --filter @workspace/app-builder test`
