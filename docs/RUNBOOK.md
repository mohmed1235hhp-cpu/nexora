# Operational Runbook

Concise, in-anger playbook. Detail lives in `docs/INFRASTRUCTURE.md`.

## Health signals

| Signal | Meaning | First action |
|---|---|---|
| `/api/healthz` 200 | Process alive | — |
| `/api/readyz` 200  | All critical deps reachable | — |
| `/api/readyz` 503  | One or more deps down | Check `checks` field in JSON body |
| `queue_depth` > 10× baseline | Workers behind or crashed | Scale workers, check DLQ |
| `db_query_duration_ms` p95 > 1s | Bad index / hot lock | Look at `perf_slow_queries` |

## Incident: API pod flapping

1. `kubectl -n cyberai get pods` — identify crashlooping pod.
2. `kubectl -n cyberai logs <pod> --previous` — read last stderr.
3. Compare to metrics — is it OOM? Bump memory limit in `api-deployment.yaml`.
4. If startup probe timing out during migrations — bump `startupProbe.failureThreshold`.

## Incident: Postgres saturated

1. `SELECT count(*) FROM pg_stat_activity;` — connection use.
2. If >80% of `max_connections`: front with PgBouncer (transaction mode).
3. `SELECT query, calls, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 20;`
4. Missing index? Add via a `0005_*.sql` migration.

## Incident: Redis outage

Behavior: cache layer falls back to in-memory LRU per pod. Rate-limits become
per-pod (weaker) but no request 500s. BullMQ jobs pause until Redis returns —
they resume automatically. Do not restart pods.

## Incident: Storage provider down

`makeFailover` in `@workspace/resilience` should be configured for reads with
a second region as fallback. Writes should retry with exponential backoff.
If prolonged: switch `STORAGE_DRIVER` env to the DR region + `kubectl rollout restart deployment/cyberai-api`.

## Rolling deploy

```bash
kubectl -n cyberai set image deployment/cyberai-api api=ghcr.io/your-org/cyberai:vX.Y.Z
kubectl -n cyberai rollout status deployment/cyberai-api
# Rollback if needed:
kubectl -n cyberai rollout undo deployment/cyberai-api
```

## Backup restore drill (quarterly)

```bash
# 1. Provision a scratch database
# 2. Restore latest base backup + WAL
# 3. Run migrations
# 4. Point staging at it and run `tests/e2e`
# 5. Record RPO/RTO in the drill log
```
