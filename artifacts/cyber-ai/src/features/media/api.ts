const API = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";
const BASE = `${API}/media-pipeline`;

// Identity now comes from the httpOnly session cookie (see api-server
// middlewares/auth.ts requireAuth), not a client-supplied header — a
// `userId` header was previously trusted as-is by the server, letting any
// caller impersonate any user. `credentials: "include"` sends the session
// cookie; the server derives the user itself.
import { csrfHeaders } from "@/lib/csrf";

const JSON_HEADERS: HeadersInit = { "Content-Type": "application/json" };

export interface JobRef { jobId: string; status: string }
export interface JobStatus {
  id: string; status: "queued" | "running" | "completed" | "failed" | "cancelled";
  progress: number; output?: unknown; error?: string | null;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { ...JSON_HEADERS, ...csrfHeaders() },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`[${r.status}] ${await r.text()}`);
  return r.json() as Promise<T>;
}

export const mediaApi = {
  generateImage: (input: { prompt: string; size?: string; n?: number }) =>
    post<JobRef>("/image", input),
  tts: (input: { text: string; voice: string; format?: string; speed?: number }) =>
    post<JobRef>("/voice/tts", input),
  stt: (input: { audioUrl: string; language?: string }) =>
    post<JobRef>("/voice/stt", input),
  ocr: (input: { imageUrl: string; language?: string }) =>
    post<JobRef>("/ocr", input),
  parseDocument: (input: { fileUrl: string; mimeType: string }) =>
    post<JobRef>("/documents", input),
  signUpload: (input: { key?: string; contentType: string; sizeBytes: number }) =>
    post<{ uploadUrl: string; method: string; key: string; publicUrl: string }>("/files/sign-upload", input),
  getJob: async (id: string): Promise<JobStatus> => {
    const r = await fetch(`${BASE}/jobs/${id}`, { headers: JSON_HEADERS, credentials: "include" });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  history: async () => {
    const r = await fetch(`${BASE}/history`, { headers: JSON_HEADERS, credentials: "include" });
    if (!r.ok) throw new Error(await r.text());
    return (await r.json()) as { items: Array<Record<string, unknown>> };
  },
  streamJob(id: string, onEvent: (evt: { type: string; data: any }) => void): () => void {
    const es = new EventSource(`${BASE}/jobs/${id}/stream`, { withCredentials: true });
    es.addEventListener("progress", (e) => onEvent({ type: "progress", data: JSON.parse((e as MessageEvent).data) }));
    es.addEventListener("done", (e) => { onEvent({ type: "done", data: JSON.parse((e as MessageEvent).data) }); es.close(); });
    es.addEventListener("timeout", () => { onEvent({ type: "timeout", data: {} }); es.close(); });
    es.addEventListener("error", () => { onEvent({ type: "error", data: {} }); es.close(); });
    return () => es.close();
  },
};
