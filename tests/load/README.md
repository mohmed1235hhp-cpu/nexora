# Load & performance tests

## k6

Install k6 (`brew install k6` / `apt install k6`) and run:

```bash
k6 run tests/load/k6-smoke.js -e BASE_URL=https://staging.cyberai.example
```

SLO targets baked into `k6-smoke.js`:

| Metric | Target |
|---|---|
| `http_req_duration` p95 | < 300ms |
| `http_req_duration` p99 | < 800ms |
| `http_req_failed` rate  | < 1%   |

## Stress test

Run the same script with a much higher target to find the breaking point:

```bash
k6 run tests/load/k6-smoke.js \
  -e BASE_URL=https://staging.cyberai.example \
  --stage 30s:0 --stage 5m:5000 --stage 5m:10000
```

## Recovery test

While the load is running, kill one API pod (`kubectl delete pod cyberai-api-xxx`)
and observe `http_req_failed` stays below the SLO — the LB routes around
the missing pod, and the Deployment brings a replacement online.
