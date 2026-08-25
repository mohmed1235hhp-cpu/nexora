import { useEffect, useState } from "react";
import { mediaApi, type JobStatus } from "./api";

function useJobStream(jobId: string | null) {
  const [job, setJob] = useState<JobStatus | null>(null);
  useEffect(() => {
    if (!jobId) return;
    const stop = mediaApi.streamJob(jobId, (evt) => {
      if (evt.type === "progress" || evt.type === "done") setJob((j) => ({ ...(j ?? {} as JobStatus), ...evt.data, id: jobId }));
    });
    return stop;
  }, [jobId]);
  return job;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

function ImageStudio() {
  const [prompt, setPrompt] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const job = useJobStream(jobId);
  const imageUrl = (job?.output as any)?.images?.[0]?.url as string | undefined;
  return (
    <Card title="Image Studio">
      <textarea className="mb-2 h-20 w-full rounded border p-2 text-sm" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe an image…" />
      <button className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground" onClick={async () => { const j = await mediaApi.generateImage({ prompt, size: "1024x1024", n: 1 }); setJobId(j.jobId); }}>Generate</button>
      {job && <p className="mt-2 text-xs text-muted-foreground">Status: {job.status} · {job.progress}%</p>}
      {imageUrl && <img src={imageUrl} alt="generated" className="mt-3 max-h-80 rounded" />}
    </Card>
  );
}

function VoiceChat() {
  const [text, setText] = useState("Hello world");
  const [jobId, setJobId] = useState<string | null>(null);
  const job = useJobStream(jobId);
  const audioUrl = (job?.output as any)?.audioUrl as string | undefined;
  return (
    <Card title="Voice Chat (TTS)">
      <input className="mb-2 w-full rounded border p-2 text-sm" value={text} onChange={(e) => setText(e.target.value)} />
      <button className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground" onClick={async () => { const j = await mediaApi.tts({ text, voice: "alloy", format: "mp3" }); setJobId(j.jobId); }}>Speak</button>
      {job && <p className="mt-2 text-xs text-muted-foreground">Status: {job.status} · {job.progress}%</p>}
      {audioUrl && <audio className="mt-3 w-full" controls src={audioUrl} />}
    </Card>
  );
}

function DocumentAnalyzer() {
  const [url, setUrl] = useState("");
  const [mime, setMime] = useState("application/pdf");
  const [jobId, setJobId] = useState<string | null>(null);
  const job = useJobStream(jobId);
  const text = (job?.output as any)?.text as string | undefined;
  return (
    <Card title="Document Analyzer">
      <input className="mb-2 w-full rounded border p-2 text-sm" placeholder="File URL" value={url} onChange={(e) => setUrl(e.target.value)} />
      <input className="mb-2 w-full rounded border p-2 text-sm" placeholder="MIME type" value={mime} onChange={(e) => setMime(e.target.value)} />
      <button className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground" onClick={async () => { const j = await mediaApi.parseDocument({ fileUrl: url, mimeType: mime }); setJobId(j.jobId); }}>Parse</button>
      {job && <p className="mt-2 text-xs text-muted-foreground">Status: {job.status} · {job.progress}%</p>}
      {text && <pre className="mt-3 max-h-60 overflow-auto rounded bg-muted p-2 text-xs whitespace-pre-wrap">{text}</pre>}
    </Card>
  );
}

function OCRStation() {
  const [url, setUrl] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const job = useJobStream(jobId);
  const text = (job?.output as any)?.text as string | undefined;
  return (
    <Card title="OCR">
      <input className="mb-2 w-full rounded border p-2 text-sm" placeholder="Image URL" value={url} onChange={(e) => setUrl(e.target.value)} />
      <button className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground" onClick={async () => { const j = await mediaApi.ocr({ imageUrl: url, language: "ara+eng" }); setJobId(j.jobId); }}>Extract Text</button>
      {job && <p className="mt-2 text-xs text-muted-foreground">Status: {job.status} · {job.progress}%</p>}
      {text && <pre className="mt-3 max-h-60 overflow-auto rounded bg-muted p-2 text-xs whitespace-pre-wrap">{text}</pre>}
    </Card>
  );
}

function HistoryTimeline() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  useEffect(() => {
    mediaApi.history().then((r) => setItems(r.items)).catch(() => {});
  }, []);
  return (
    <Card title="History">
      <ul className="max-h-72 space-y-1 overflow-auto text-xs">
        {items.map((row, i) => (
          <li key={i} className="rounded border border-border p-2">
            <span className="font-medium">{String(row.kind)}</span> · {String(row.provider)} · {String(row.latency_ms)}ms
          </li>
        ))}
        {items.length === 0 && <li className="text-muted-foreground">No history yet.</li>}
      </ul>
    </Card>
  );
}

export default function MediaStudio() {
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 p-6 md:grid-cols-2">
      <ImageStudio />
      <VoiceChat />
      <OCRStation />
      <DocumentAnalyzer />
      <div className="md:col-span-2"><HistoryTimeline /></div>
    </div>
  );
}
