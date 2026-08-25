// k6 smoke + load profile. Run with:
//   k6 run tests/load/k6-smoke.js -e BASE_URL=https://staging.cyberai.example
//
// Stages:
//   1) warm-up   — 30s ramp to 50 VUs
//   2) steady    — 2m at 200 VUs
//   3) spike     — 30s at 1000 VUs
//   4) cool-down — 30s to 0
//
// Thresholds enforce enterprise SLOs: p95 < 300ms, error rate < 1%.
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    smoke: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 50 },
        { duration: "2m",  target: 200 },
        { duration: "30s", target: 1000 },
        { duration: "30s", target: 0 },
      ],
      gracefulRampDown: "10s",
    },
  },
  thresholds: {
    http_req_failed:   ["rate<0.01"],
    http_req_duration: ["p(95)<300", "p(99)<800"],
  },
};

const BASE = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  const healthz = http.get(`${BASE}/api/healthz`);
  check(healthz, { "healthz 200": r => r.status === 200 });

  const readyz = http.get(`${BASE}/api/readyz`);
  check(readyz, { "readyz ok": r => r.status === 200 });

  sleep(1);
}
