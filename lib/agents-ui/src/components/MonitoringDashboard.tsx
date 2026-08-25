/**
 * Phase 8 monitoring dashboard — headless React components.
 *
 * All styling is delegated to the caller via `className`. No CSS
 * dependency, no design system lock-in. The components render standard
 * semantic HTML so they slot into any app's layout.
 */
import * as React from 'react';
import { useMemo } from 'react';
import { useMonitoringStream, type UIMonitoringEvent } from '../hooks/useMonitoringStream.js';

export interface DashboardProps {
  readonly sseUrl: string;
  readonly capacity?: number;
  readonly className?: string;
}

export function MonitoringDashboard(props: DashboardProps): React.ReactElement {
  const { events, connected, error } = useMonitoringStream({ url: props.sseUrl, capacity: props.capacity });

  const groups = useMemo(() => summarize(events), [events]);

  return (
    <div className={props.className} data-phase8-dashboard>
      <header>
        <h2>Phase 8 Monitoring</h2>
        <p>Status: {connected ? 'connected' : 'disconnected'} {error ? `· ${error}` : ''}</p>
      </header>

      <section aria-label="Agents">
        <h3>Agents</h3>
        <ul>
          {groups.agents.map(a => (
            <li key={a.id}>
              <strong>{a.id}</strong> — {a.state} · {a.eventCount} events
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Workers">
        <h3>Workers</h3>
        <ul>
          {groups.workers.map(w => (
            <li key={w.id}>
              <strong>{w.id}</strong> — {w.state} · task {w.currentTask ?? '—'} · processed {w.processed} · failed {w.failed}
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Pipeline">
        <h3>Pipeline</h3>
        <ul>
          {groups.pipeline.map(p => (
            <li key={p.runId}>
              <strong>{p.runId}</strong> — {p.lastStep ?? 'starting'}
              {p.done ? ' · done' : ''}
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Logs">
        <h3>Recent events ({events.length})</h3>
        <ol>
          {events.slice(-50).reverse().map(e => (
            <li key={e.id}>
              <code>{new Date(e.ts).toISOString().slice(11, 19)}</code>{' '}
              <em>{e.kind}</em>{' '}
              <span>{e.source}</span>{' '}
              <pre style={{ display: 'inline' }}>{safeJson(e.payload)}</pre>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function safeJson(v: unknown): string {
  try { const s = JSON.stringify(v); return s.length > 240 ? s.slice(0, 240) + '…' : s; }
  catch { return String(v); }
}

interface AgentSummary { id: string; state: string; eventCount: number }
interface WorkerSummary { id: string; state: string; currentTask?: string; processed: number; failed: number }
interface PipelineSummary { runId: string; lastStep?: string; done: boolean }
interface Groups { agents: AgentSummary[]; workers: WorkerSummary[]; pipeline: PipelineSummary[] }

function summarize(events: readonly UIMonitoringEvent[]): Groups {
  const agents = new Map<string, AgentSummary>();
  const workers = new Map<string, WorkerSummary>();
  const pipeline = new Map<string, PipelineSummary>();

  for (const e of events) {
    if (e.kind === 'agent.state' || e.kind === 'agent.log') {
      const cur = agents.get(e.source) ?? { id: e.source, state: 'active', eventCount: 0 };
      cur.eventCount += 1;
      const p = e.payload as { status?: string };
      if (p?.status) cur.state = p.status;
      agents.set(e.source, cur);
    } else if (e.kind === 'worker.state' || e.kind === 'worker.log') {
      const cur = workers.get(e.source) ?? { id: e.source, state: 'idle', processed: 0, failed: 0 };
      const p = e.payload as { status?: string; taskId?: string; ok?: boolean };
      if (p?.status) cur.state = p.status;
      if (p?.taskId) cur.currentTask = p.taskId;
      if (p?.ok === true) cur.processed += 1;
      if (p?.ok === false) cur.failed += 1;
      workers.set(e.source, cur);
    } else if (e.kind === 'pipeline.step') {
      const runId = e.source;
      const p = e.payload as { step?: string };
      const cur = pipeline.get(runId) ?? { runId, done: false };
      cur.lastStep = p?.step;
      if (p?.step === 'pipeline.done') cur.done = true;
      pipeline.set(runId, cur);
    }
  }

  return {
    agents: Array.from(agents.values()),
    workers: Array.from(workers.values()),
    pipeline: Array.from(pipeline.values()),
  };
}
