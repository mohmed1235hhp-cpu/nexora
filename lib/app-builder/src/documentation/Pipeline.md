# Pipeline

Stages: Plan → Generate → Review → Fix → Tests → Security → Perf → Package → Report.

Each stage receives an `AgentContext` and returns typed artifacts.
