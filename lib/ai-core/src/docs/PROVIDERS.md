# Providers
All providers implement `IProvider` plus a task-specific interface
(e.g. `ITextChatProvider`). They are discovered via `ProviderRegistry` and
selected by capability via `ProviderManager.resolve(capability)`.
Only `NoopProvider` is registered by default.
