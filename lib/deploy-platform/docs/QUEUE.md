# Queue System

Five queues share a common `BaseQueue<T>` and are aggregated by
`QueueManager`. Draining order: `premium → priority → retry → global → delayed`.

- Every enqueue records `enqueuedAt`, `priority`, and optional `notBefore`.
- `dequeue()` respects the delay window.
- Stats include size / inflight / processed / failed per queue.

Phase 2 will provide a Redis or Postgres-backed driver behind `IQueue`.
