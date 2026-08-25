import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, History, Trash2, MessageSquare } from "lucide-react";
import { csrfHeaders } from "@/lib/csrf";

type Conversation = { id: number; title: string; createdAt: string; updatedAt: string };
type Row = { id: number; role: string; content: string; provider?: string; model?: string; intent?: string; attachments?: any[] };

export default function ChatHistory() {
  const [items, setItems] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<{conversation: Conversation; messages: Row[]} | null>(null);
  const [error, setError] = useState("");

  async function load() {
    const r = await fetch("/api/ai/conversations");
    if (r.status === 401) { setError("سجل المحادثات يحتاج تسجيل الدخول."); return; }
    const j = await r.json(); setItems(j.conversations || []);
  }
  useEffect(() => { load(); }, []);

  async function open(id: number) {
    const r = await fetch(`/api/ai/conversations/${id}`);
    if (!r.ok) return;
    setSelected(await r.json());
  }
  async function remove(id: number) {
    if (!confirm("حذف هذه المحادثة؟")) return;
    await fetch(`/api/ai/conversations/${id}`, { method: "DELETE", credentials: "include", headers: { ...csrfHeaders() } });
    setSelected(null); load();
  }

  return <div dir="rtl" className="relative min-h-screen overflow-hidden bg-[#02040d] p-5 pb-28 text-white">
    <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(139,92,246,.16),transparent_40%)]" />
    <div className="relative z-10 mx-auto max-w-6xl">
      <div className="mb-6 flex items-center gap-3"><Link href="/"><ArrowRight className="h-5 w-5 text-violet-300 hover:text-violet-200" /></Link><History className="h-6 w-6 text-violet-300" /><h1 className="text-2xl font-black tracking-tight">سجل المحادثات</h1></div>
      {error && <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-200">{error}</div>}
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <div className="space-y-2">
          {items.length === 0 && !error && <div className="rounded-2xl border border-dashed border-violet-500/20 bg-white/[.02] p-6 text-center text-sm text-slate-500">لا توجد محادثات محفوظة بعد.<br />ابدأ محادثة جديدة من الصفحة الرئيسية.</div>}
          {items.map(c => <button key={c.id} onClick={() => open(c.id)} className="w-full rounded-xl border border-violet-500/15 bg-white/[.025] p-4 text-right transition-all hover:border-violet-400/50 hover:bg-violet-500/[.06] hover:shadow-[0_0_24px_rgba(139,92,246,.15)]"><div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-violet-300" /><span className="truncate font-semibold">{c.title}</span></div><div className="mt-2 text-[10px] text-slate-500">{new Date(c.updatedAt).toLocaleString()}</div></button>)}
        </div>
        <div className="min-h-[500px] rounded-2xl border border-violet-500/15 bg-white/[.02] p-4 shadow-[0_0_40px_rgba(139,92,246,.08)]">
          {!selected ? <div className="flex h-full items-center justify-center text-slate-500">اختر محادثة لعرضها</div> : <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3"><h2 className="font-bold">{selected.conversation.title}</h2><button onClick={() => remove(selected.conversation.id)} className="rounded-lg p-2 text-red-300 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button></div>
            {selected.messages.map(m => <div key={m.id} className={`rounded-xl border p-4 ${m.role === "user" ? "border-cyan-400/15 bg-cyan-400/[.03]" : "border-violet-500/15 bg-violet-500/[.03]"}`}><div className="mb-1 text-[10px] text-slate-500">{m.role === "user" ? "YOU" : `CYBER AI · ${m.provider || ""} ${m.model || ""}`}</div><div className="whitespace-pre-wrap text-sm leading-7">{m.content}</div>{m.attachments?.length ? <div className="mt-2 text-xs text-cyan-300">ملفات مرتبطة: {m.attachments.map((a:any) => a.name).join("، ")}</div> : null}</div>)}
          </div>}
        </div>
      </div>
    </div>
  </div>;
}
