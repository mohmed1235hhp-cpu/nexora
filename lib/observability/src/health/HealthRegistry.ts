import { Registry } from "../core/Registry.js";
import type { HealthCheck } from "./types.js";
export class HealthRegistry extends Registry<HealthCheck> {}
