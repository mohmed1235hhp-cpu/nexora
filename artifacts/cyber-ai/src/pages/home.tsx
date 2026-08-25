import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Bot, BrainCircuit, CheckCircle2, Code2, FolderKanban, Image as ImageIcon, Mic, Paperclip, Search, Send, Sparkles, Video, X, Eye, AudioLines, Globe, Smartphone, Film, User } from "lucide-react";
import { useCreditsManager } from "@/hooks/use-credits-manager";
import { cn } from "@/lib/utils";
import { csrfHeaders } from "@/lib/csrf";

type Role = "user" | "assistant";
type Intent = "chat" | "image" | "website" | "app" | "video" | "code";
type Preview = { id: string; url: string };
type MediaKind = "audio" | "video" | "image";
type Attachment = { name: string; mimeType?: string; size?: number; url?: string };

type Message = {
  role: Role;
  content: string;
  intent?: Intent;
  steps?: string[];
  preview?: Preview;
  audioBase64?: string;
};

const AGENT_TOOLS = [
  { key: "chat", label: "محادثة", icon: Bot, prompt: "تحدث معي ونفّذ طلبي تلقائيًا." },
  { key: "image", label: "صورة", icon: ImageIcon, prompt: "أنشئ صورة احترافية بناءً على: " },
  { key: "vision", label: "فهم صورة", icon: Eye, media: "image", prompt: "حلل هذه الصورة بالتفصيل." },
  { key: "video", label: "فهم فيديو", icon: Film, media: "video", prompt: "حلل هذا الفيديو بالتفصيل." },
  { key: "voice", label: "صوت", icon: AudioLines, media: "audio", prompt: "استمع إلى هذا الصوت ورد عليّ." },
  { key: "stt", label: "صوت→نص", icon: Mic, media: "audio", prompt: "حوّل هذا التسجيل إلى نص دقيق." },
  { key: "website", label: "موقع", icon: Globe, prompt: "أنشئ موقع ويب كامل واحترافي لـ: " },
  { key: "app", label: "تطبيق", icon: Smartphone, prompt: "أنشئ تطبيقًا كاملًا لـ: " },
  { key: "code", label: "كود", icon: Code2, prompt: "اكتب الكود ونفّذه وراجعه وأصلح أخطاءه لـ: " },
];

const NAV = [
  { label: "AI LAB", href: "/", icon: Sparkles, tone: "purple" },
  { label: "PROJECTS", href: "/explore", icon: FolderKanban, tone: "blue" },
  { label: "CYBER CORE", href: "/cyber-core", icon: BrainCircuit, tone: "violet", center: true },
  { label: "CHAT", href: "/chat-history", icon: Bot, tone: "green" },
  { label: "ACCOUNT", href: "/settings", icon: User, tone: "gold" },
];

const NAV_GLOW: Record<string, string> = {
  purple: "border-fuchsia-400/60 bg-fuchsia-500/15 shadow-[0_0_18px_rgba(232,121,249,.5)]",
  blue: "border-cyan-400/60 bg-cyan-500/15 shadow-[0_0_18px_rgba(34,211,238,.5)]",
  violet: "border-violet-400/60 bg-violet-500/15 shadow-[0_0_18px_rgba(167,139,250,.5)]",
  green: "border-emerald-400/60 bg-emerald-500/15 shadow-[0_0_18px_rgba(52,211,153,.5)]",
  gold: "border-amber-400/60 bg-amber-500/15 shadow-[0_0_18px_rgba(252,211,77,.5)]",
};

export default function Home() {
  const [location] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("جاهز");
  const [workStartedAt, setWorkStartedAt] = useState<number | null>(null);
  const [attached, setAttached] = useState<Attachment[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [activeTool, setActiveTool] = useState("chat");
  const { consumeCredits } = useCreditsManager(8);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, pending]);
  useEffect(() => { if (!pending) return; const id = window.setInterval(() => setWorkStartedAt((x) => x ? x : Date.now()), 1000); return () => window.clearInterval(id); }, [pending]);

  async function send(text = input) {
    const value = text.trim();
    if (!value || pending) return;
    const user: Message = { role: "user", content: value };
    const history = [...messages, user];
    setMessages([...history, { role: "assistant", content: "", steps: [] }]);
    setInput("");
    setPending(true);
    setStatus("جاري التنفيذ…");
    setWorkStartedAt(Date.now());

    try {
      const response = await fetch("/api/ai/assistant/stream", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream", ...csrfHeaders() },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          conversationId: conversationId ?? undefined,
          attachments,
        }),
      });
      if (!response.ok || !response.body) throw new Error("request failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalMeta: { intent?: Intent; preview?: Preview } = {};

      const applyEvent = (event: string, payload: any) => {
        if (event === "status") {
          setStatus(payload.text || "Working...");
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last?.role === "assistant") last.steps = [...(last.steps || []), payload.text];
            return copy;
          });
        } else if (event === "delta") {
          setStatus("Cyber AI is writing...");
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last?.role === "assistant") last.content += payload.text || "";
            return copy;
          });
        } else if (event === "done") {
          finalMeta = payload; if (payload.conversationId) setConversationId(payload.conversationId);
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last?.role === "assistant") {
              last.intent = payload.intent;
              last.preview = payload.preview;
              last.content = payload.content || last.content;
            }
            return copy;
          });
        } else if (event === "error") {
          throw new Error(payload.message || "AI error");
        }
      };

      while (true) {
        const { value: chunk, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(chunk, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() || "";
        for (const frame of frames) {
          const event = frame.match(/^event:\s*(.+)$/m)?.[1] || "message";
          const data = frame.match(/^data:\s*(.+)$/m)?.[1];
          if (data) applyEvent(event, JSON.parse(data));
        }
      }
      consumeCredits("assistant", "Cyber AI", value.slice(0, 50));
      setStatus(finalMeta.preview ? "المعاينة جاهزة" : "جاهز");
    } catch {
      setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: "تعذر تنفيذ الطلب الآن. تأكد من إعداد AI API ثم حاول مرة أخرى." }]);
      setStatus("تعذر الاتصال");
    } finally {
      setPending(false);
      setWorkStartedAt(null);
    }
  }

  async function sendMedia(file: File, kind: MediaKind) {
    if (pending) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const data = String(reader.result || "");
      const userText = input.trim() || (kind === "audio" ? "استمع إلى هذا الصوت وأجبني." : kind === "video" ? "حلل هذا الفيديو وأجبني." : "حلل هذه الصورة وأجبني.");
      setMessages((m) => [...m, { role: "user", content: userText }, { role: "assistant", content: "", steps: ["تحليل الوسائط عبر الوكيل الرئيسي"] }]);
      setInput(""); setPending(true); setWorkStartedAt(Date.now()); setStatus("تحليل الوسائط…");
      try {
        const response = await fetch("/api/ai/omni", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", ...csrfHeaders() }, body: JSON.stringify({ text: userText, mediaBase64: data, mimeType: file.type, kind, conversationId: conversationId ?? undefined, attachment: { name: file.name, mimeType: file.type, size: file.size } }) });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "media error");
        if (payload.conversationId) setConversationId(payload.conversationId);
        setMessages((prev) => { const copy = [...prev]; const last = copy[copy.length - 1]; if (last?.role === "assistant") { last.content = payload.result || ""; last.audioBase64 = payload.audioBase64; } return copy; });
        if (kind === "audio" && payload.result && typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(String(payload.result));
          utterance.lang = /[\u0600-\u06FF]/.test(String(payload.result)) ? "ar-EG" : "en-US";
          window.speechSynthesis.speak(utterance);
        }
        setStatus("جاهز");
      } catch (e) { setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: e instanceof Error ? e.message : "تعذر تحليل الوسائط." }]); setStatus("Connection error"); }
      finally { setPending(false); setWorkStartedAt(null); }
    };
    reader.readAsDataURL(file);
  }

  async function toggleRecording() {
    if (recording && recorderRef.current) { recorderRef.current.stop(); setRecording(false); return; }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream); chunksRef.current = [];
    recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    recorder.onstop = () => { const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }); stream.getTracks().forEach((t) => t.stop()); sendMedia(new File([blob], "voice.webm", { type: blob.type }), "audio"); };
    recorderRef.current = recorder; recorder.start(); setRecording(true); setStatus("Listening...");
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []).map((f) => ({ name: f.name, mimeType: f.type, size: f.size }));
    setAttached((x) => [...x, ...selected].slice(0, 10));
    // File transport is intentionally left to the existing project upload pipeline.
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#02040d] text-white" dir="rtl">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(119,62,255,.20),transparent_35%),radial-gradient(circle_at_90%_70%,rgba(45,190,255,.08),transparent_30%)]" />

      <header className="relative z-10 flex h-20 items-center justify-between border-b border-violet-500/20 bg-[#050812]/90 px-4 backdrop-blur-xl md:px-8">
        <div className="flex items-center gap-4">
          <img src="/cyber-core-icon.png" alt="Cyber AI" className="h-14 w-16 object-cover rounded-xl border border-violet-400/40 shadow-[0_0_35px_rgba(139,92,246,.45)]" />
          <div>
            <div className="text-xl font-black tracking-[.18em] text-white">CYBER AI</div>
            <div className="flex items-center gap-2 text-sm text-emerald-400"><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />{status}</div>
          </div>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <div className="rounded-full border border-violet-400/20 bg-violet-500/[.06] px-4 py-2 text-xs font-semibold text-violet-100 shadow-[0_0_30px_rgba(139,92,246,.08)]">
            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
            توجيه ذكي تلقائي
          </div>
          <div className="rounded-full border border-cyan-400/20 bg-cyan-400/[.05] px-4 py-2 text-xs font-semibold text-cyan-100">Gemini · OpenRouter · Groq</div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex h-[calc(100vh-10rem)] max-w-6xl flex-col px-3 py-4 md:px-6">
        {pending && <div className="mb-3 overflow-hidden rounded-2xl border border-violet-400/25 bg-gradient-to-r from-violet-500/[.10] via-fuchsia-500/[.06] to-cyan-400/[.08] p-3 shadow-[0_0_45px_rgba(139,92,246,.12)]">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-300/25 bg-violet-400/10">
              <Sparkles className="h-5 w-5 animate-pulse text-violet-200" />
              <span className="absolute inset-0 animate-ping rounded-xl border border-violet-300/20" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <div className="truncate text-sm font-bold text-white">{status}</div>
                <div className="text-[11px] text-slate-400">{workStartedAt ? `${Math.max(0, Math.floor((Date.now() - workStartedAt) / 1000))}s` : ""}</div>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5"><div className="h-full w-1/3 animate-[shimmer_1.4s_infinite] rounded-full bg-gradient-to-r from-transparent via-violet-300 to-transparent" /></div>
              <div className="mt-2 text-[11px] text-slate-400">العملية تعمل فعليًا في الخلفية. يمكنك متابعة الحالة هنا حتى تكتمل النتيجة.</div>
            </div>
          </div>
        </div>}

        <section className="min-h-0 flex-1 overflow-y-auto rounded-[28px] border border-violet-500/20 bg-[#060914]/80 p-3 shadow-[inset_0_0_60px_rgba(98,52,180,.06)] md:p-6">
          {messages.length === 0 ? <EmptyState onPrompt={send} /> : (
            <div className="mx-auto max-w-4xl space-y-5">
              {messages.map((m, i) => <Message key={i} message={m} />)}
              <div ref={endRef} />
            </div>
          )}
        </section>

        <div className="pt-3">
          <div className="mb-2 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {AGENT_TOOLS.map(({ key, label, icon: Icon, media, prompt }) => (
              <button key={key} type="button" onClick={() => {
                setActiveTool(key);
                if (media) { mediaRef.current?.click(); return; }
                if (key === "chat") { setInput(""); return; }
                setInput(prompt);
              }} className={cn("flex min-w-fit items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition", activeTool === key ? "border-violet-400/60 bg-violet-500/15 text-violet-100 shadow-[0_0_20px_rgba(139,92,246,.12)]" : "border-white/10 bg-white/[.02] text-slate-400 hover:border-violet-400/30 hover:text-violet-200")}>
                <Icon className="h-4 w-4" />{label}
              </button>
            ))}
          </div>
          {attached.length > 0 && <div className="mb-2 flex flex-wrap gap-2">{attached.map((x, i) => <button key={`${x.name}-${i}`} onClick={() => setAttached(attached.filter((_, j) => j !== i))} className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1 text-xs text-cyan-200">{x.name} <X className="mr-1 inline h-3 w-3" /></button>)}</div>}
          <div className="flex items-end gap-2 rounded-2xl border border-violet-500/35 bg-[#070a15] p-2 shadow-[0_0_35px_rgba(139,92,246,.10)] focus-within:border-violet-400">
            <button onClick={() => fileRef.current?.click()} className="rounded-xl p-3 text-violet-300 hover:bg-violet-500/10"><Paperclip className="h-5 w-5" /></button>
            <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFiles} />
            <input ref={mediaRef} type="file" accept="image/*,audio/*,video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) sendMedia(f, f.type.startsWith("audio/") ? "audio" : f.type.startsWith("video/") ? "video" : "image"); e.currentTarget.value = ""; }} />
            <button onClick={toggleRecording} className={cn("rounded-xl p-3 hover:bg-cyan-500/10", recording ? "text-red-400" : "text-cyan-300")} aria-label="voice"><Mic className="h-5 w-5" /></button>
            <button onClick={() => mediaRef.current?.click()} className="rounded-xl p-3 text-fuchsia-300 hover:bg-fuchsia-500/10" aria-label="media"><Video className="h-5 w-5" /></button>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="اكتب طلبك... Cyber AI يفهم وينفذ" className="min-h-[50px] max-h-36 flex-1 resize-none bg-transparent px-2 py-3 text-right outline-none placeholder:text-slate-500" />
            <button onClick={() => send()} disabled={pending || !input.trim()} className="rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 p-3 shadow-[0_0_25px_rgba(139,92,246,.35)] disabled:opacity-40"><Send className="h-5 w-5 -rotate-180" /></button>
          </div>
        </div>
      </main>

      <nav className="relative z-20 flex items-end justify-around gap-1.5 border-t border-white/5 bg-[#050812]/95 px-2 pb-3 pt-3 backdrop-blur-xl">
        {NAV.map(({ label, href, icon: Icon, tone, center }) => {
          const isActive = location === href || (href !== "/" && location.startsWith(href));
          const toneText = tone === "purple" ? "text-fuchsia-300" : tone === "blue" ? "text-cyan-300" : tone === "violet" ? "text-violet-300" : tone === "green" ? "text-emerald-300" : "text-amber-300";
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl border border-transparent py-2 text-[9px] font-bold tracking-wider transition-all",
                center && "-translate-y-3 border-violet-400/30 bg-gradient-to-b from-fuchsia-500/20 to-violet-600/10 px-2 py-3 shadow-[0_0_28px_rgba(217,70,239,.35)]",
                isActive ? cn(toneText, NAV_GLOW[tone]) : "text-slate-500 hover:text-slate-300",
              )}
            >
              <Icon className={cn(center ? "h-6 w-6" : "h-5 w-5", isActive && toneText)} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function EmptyState({ onPrompt }: { onPrompt: (x: string) => void }) {
  return <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center"><div className="mb-6 rounded-[32px] border border-violet-400/25 bg-gradient-to-br from-violet-500/10 to-cyan-400/5 p-3 shadow-[0_0_80px_rgba(139,92,246,.18)]"><img src="/cyber-core-icon.png" alt="Cyber AI" className="h-28 w-36 rounded-2xl object-cover" /></div><div className="mb-3 rounded-full border border-white/10 bg-white/[.03] px-4 py-1.5 text-[11px] font-semibold text-violet-200">وكيل واحد · توجيه تلقائي · تنفيذ فعلي</div><h1 className="text-4xl font-black tracking-tight md:text-6xl">CYBER AI</h1><p className="mt-4 max-w-2xl text-sm leading-8 text-slate-400">اكتب هدفك فقط. الوكيل يفهمه، يختار المسار المناسب، ثم ينفّذ المهمة ويعرض النتيجة عندما تصبح جاهزة.</p><div className="mt-6 grid max-w-2xl gap-2 md:grid-cols-3">{["ابنِ لي موقعًا لمتجر إلكتروني", "راجع هذا الكود وأصلح أخطاءه", "ابحث لي عن أفضل حل للمشكلة"].map((x) => <button key={x} onClick={() => onPrompt(x)} className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 text-xs text-violet-200 hover:bg-violet-500/10">{x}</button>)}</div></div>;
}

function Message({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return <div className={cn("flex gap-3", isUser ? "justify-start" : "justify-end")}><div className={cn("max-w-[92%] rounded-2xl border p-4", isUser ? "border-cyan-400/20 bg-cyan-400/[.04]" : "border-violet-500/20 bg-white/[.025]")}>
    <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">{isUser ? <><span>YOU</span></> : <><img src="/cyber-core-icon.png" className="h-6 w-7 rounded-md object-cover" alt="" /><span>CYBER AI</span></>}</div>
    {message.steps && message.steps.length > 0 && <div className="mb-3 space-y-1 rounded-xl border border-violet-500/10 bg-black/10 p-2">{message.steps.slice(-5).map((step, i) => <div key={`${step}-${i}`} className="flex items-center gap-2 text-[11px] text-violet-200"><CheckCircle2 className="h-3 w-3" />{step}</div>)}</div>}
    <div className="whitespace-pre-wrap text-sm leading-7 text-slate-100">{message.content || ""}<span className="ml-1 inline-block h-4 w-1 animate-pulse bg-violet-400" /></div>
    {message.audioBase64 && <audio className="mt-3 w-full" controls src={`data:audio/wav;base64,${message.audioBase64}`} />} 
    {message.preview && <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/[.04] p-4"><div className="flex items-center gap-2 text-sm font-bold text-emerald-300"><CheckCircle2 className="h-4 w-4" />رابط معاينة المشروع جاهز</div><a href={message.preview.url} target="_blank" rel="noreferrer" className="mt-3 block truncate rounded-xl border border-violet-400/20 bg-black/20 p-3 text-xs text-cyan-300">{message.preview.url}</a><div className="mt-3 flex gap-2"><a href={message.preview.url} target="_blank" rel="noreferrer" className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold">فتح المعاينة</a><button onClick={() => navigator.clipboard?.writeText(message.preview!.url)} className="rounded-lg border border-white/10 px-3 py-2 text-xs">نسخ الرابط</button></div></div>}
  </div></div>;
}
