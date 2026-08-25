# Hosting Layer

- `HostingService` implements `IHostingService` and stores hosted state in memory.
- `InternalUrlGenerator` produces `<projectId>--<buildId>.<baseDomain>` URLs.
- `DomainPlaceholder` and `SslPlaceholder` provide the extension points that
  Phase 2 will fill with real DNS + ACME integrations.
- `InMemoryProjectRegistry` implements `IProjectRegistry`.

No hosting call reaches the network in Phase 1.
