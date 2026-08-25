export interface BundleReport { modules: number; totalBytes: number; largest: readonly { name: string; bytes: number }[]; }

/** Analyzes a mapping of module -> byte size and produces a simple report. */
export class BundleOptimizer {
  analyze(sizes: Readonly<Record<string, number>>, topN = 10): BundleReport {
    const entries = Object.entries(sizes);
    const largest = entries.sort((a, b) => b[1] - a[1]).slice(0, topN).map(([name, bytes]) => ({ name, bytes }));
    const totalBytes = entries.reduce((a, [, b]) => a + b, 0);
    return { modules: entries.length, totalBytes, largest };
  }
  recommend(sizes: Readonly<Record<string, number>>, thresholdBytes = 250_000): readonly string[] {
    return Object.entries(sizes)
      .filter(([, b]) => b > thresholdBytes)
      .map(([n, b]) => `Consider code-splitting ${n} (${b} bytes)`);
  }
}
