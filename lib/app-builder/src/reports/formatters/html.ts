import type { FinalReport } from "../FinalReport";
export function toHtml(r: FinalReport): string {
  return `<!doctype html><html><body>
<h1>Build Report ${r.jobId}</h1>
<p>Readiness: ${r.readinessScore}/100</p>
<pre>${JSON.stringify(r.counts, null, 2)}</pre>
</body></html>`;
}
