# Memory
`MemoryManager` exposes five scopes: short, long, conversation, temporary,
project. All scopes share the `IMemoryStore` contract; the default
implementation is `InMemoryStore`.
