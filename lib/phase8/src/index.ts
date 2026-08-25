// Phase 8 — public entry
export * as pipeline from './pipeline/index.js';
export * as queue from './queue/index.js';
export * as workers from './workers/index.js';
export * as hosting from './hosting/index.js';
export * as serverManager from './server-manager/index.js';
export * as detector from './detector/index.js';
export * as monitoring from './monitoring/index.js';
export * as security from './security/index.js';
export * as cache from './cache/index.js';
export * as artifacts from './artifacts/index.js';
export * as proxy from './proxy/index.js';

export const PHASE = 8 as const;
export const VERSION = '0.8.0' as const;
