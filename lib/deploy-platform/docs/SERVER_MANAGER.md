# Server Manager (Placeholder)

Exposes the exact surface future infrastructure code must implement:

- `IServerManager` — registry + selection + heartbeats
- `IServerProvider` — provision / release / describe

Included placeholders:

- `ServerRegistryPlaceholder`, `ServerPoolPlaceholder`
- `ServerHealthMonitorPlaceholder`
- `AutoScalingPlaceholder`, `LoadBalancerPlaceholder`
- `regionPlaceholders`, `ResourceManagerPlaceholder`

**Nothing in this directory contacts a real machine.** Phase 2 swaps the
`Placeholder` classes for real providers without touching consumers.
