/**
 * Fallback chain: primary → backup → graceful degradation.
 * Never throws once a graceful fallback is provided.
 */
export interface FallbackStep<T> {
  readonly name: string;
  run(): Promise<T>;
}

export interface FallbackResult<T> {
  readonly ok: boolean;
  readonly value?: T;
  readonly usedStep: string;
  readonly attempts: readonly { name: string; error?: string }[];
}

export async function runWithFallback<T>(
  steps: readonly FallbackStep<T>[],
  gracefulValue: () => T,
): Promise<FallbackResult<T>> {
  const attempts: { name: string; error?: string }[] = [];
  for (const step of steps) {
    try {
      const value = await step.run();
      attempts.push({ name: step.name });
      return { ok: true, value, usedStep: step.name, attempts };
    } catch (err) {
      attempts.push({ name: step.name, error: err instanceof Error ? err.message : String(err) });
    }
  }
  return { ok: false, value: gracefulValue(), usedStep: "graceful", attempts };
}
