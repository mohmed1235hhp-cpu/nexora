export const LIMITS_CONFIG = {
  perUser: { requestsPerMinute: 60 },
  perTask: { requestsPerMinute: 120 },
  perProvider: { requestsPerMinute: 240 },
  global: { requestsPerMinute: 600 },
} as const;
