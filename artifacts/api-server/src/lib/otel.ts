/**
 * OpenTelemetry bootstrap (traces only — no metrics exporter is wired here).
 * Lazy — active only when OTEL_EXPORTER_OTLP_ENDPOINT is set.
 *
 * Install:  pnpm add @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node \
 *                    @opentelemetry/exporter-trace-otlp-http
 */
export async function initTelemetry(serviceName = "cyber-ai-api") {
  if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) return;
  try {
    const { NodeSDK } = await import("@opentelemetry/sdk-node");
    const { getNodeAutoInstrumentations } = await import("@opentelemetry/auto-instrumentations-node");
    const { OTLPTraceExporter } = await import("@opentelemetry/exporter-trace-otlp-http");
    const sdk = new NodeSDK({
      serviceName,
      traceExporter: new OTLPTraceExporter(),
      instrumentations: [getNodeAutoInstrumentations()],
    });
    await sdk.start();
    process.on("SIGTERM", () => sdk.shutdown().catch(() => {}));
  } catch (e) {
    console.warn("[otel] disabled:", (e as Error).message);
  }
}
