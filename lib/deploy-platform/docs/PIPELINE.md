# Build Pipeline

14 stages, executed in order, each returning a `BuildStageResult`:

1. receive     📥
2. validate    🧠
3. install     📦
4. analyze     🔎
5. compile     🏗
6. bundle      🧱
7. optimize    ⚡
8. review      🔎
9. fix-errors  🛠
10. test       🧪
11. artifacts  📦
12. preview    👁
13. url        🌐
14. report     📄

A failed stage marks the build failed and skips remaining stages.
Every stage is a class implementing `IStageExecutor`, so Phase 2 can
swap any stage for a real agent-backed implementation without touching
`BuildPipeline`.
