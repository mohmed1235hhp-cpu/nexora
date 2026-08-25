# Testing
Unit tests use `vitest`. Mocks live under `testing/mocks/`. The default
end-to-end test drives `AIRouter.execute()` and asserts `NoopProvider`
returns `provider-not-configured` for every task.
