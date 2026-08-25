export class ObservabilityError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "ObservabilityError";
  }
}
export class ConfigurationError extends ObservabilityError { constructor(m: string, c?: unknown) { super(m, c); this.name = "ConfigurationError"; } }
export class HealthCheckError    extends ObservabilityError { constructor(m: string, c?: unknown) { super(m, c); this.name = "HealthCheckError"; } }
export class MetricError         extends ObservabilityError { constructor(m: string, c?: unknown) { super(m, c); this.name = "MetricError"; } }
export class SinkError           extends ObservabilityError { constructor(m: string, c?: unknown) { super(m, c); this.name = "SinkError"; } }
