import { Link } from "wouter";
import { Settings, MessageSquare, BrainCircuit, Smartphone, Info, ShieldCheck, ScrollText, History } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/settings", icon: Settings, title: "الإعدادات", text: "إعدادات التطبيق والحساب", tone: "violet" },
  { href: "/messages", icon: MessageSquare, title: "الرسائل", text: "رسائل وتنبيهات التطبيق", tone: "cyan" },
  { href: "/", icon: BrainCircuit, title: "الذكاء الاصطناعي", text: "العودة إلى Cyber AI الرئيسي", tone: "fuchsia" },
  { href: "/app-info", icon: Smartphone, title: "التطبيق", text: "معلومات وإصدار التطبيق", tone: "emerald" },
  { href: "/about", icon: Info, title: "عن التطبيق", text: "تعرف على Cyber AI", tone: "amber" },
  { href: "/privacy", icon: ShieldCheck, title: "سياسة الخصوصية", text: "الخصوصية وحماية البيانات", tone: "cyan" },
  { href: "/terms", icon: ScrollText, title: "الشروط والأحكام", text: "شروط استخدام التطبيق", tone: "violet" },
  { href: "/chat-history", icon: History, title: "سجل المحادثات", text: "كل محادثاتك المحفوظة", tone: "fuchsia" },
];

const TONE: Record<string, { icon: string; ring: string; glow: string }> = {
  violet: { icon: "text-violet-300", ring: "hover:border-violet-400/50", glow: "hover:shadow-[0_0_30px_rgba(139,92,246,.18)]" },
  cyan: { icon: "text-cyan-300", ring: "hover:border-cyan-400/50", glow: "hover:shadow-[0_0_30px_rgba(34,211,238,.18)]" },
  fuchsia: { icon: "text-fuchsia-300", ring: "hover:border-fuchsia-400/50", glow: "hover:shadow-[0_0_30px_rgba(232,121,249,.18)]" },
  emerald: { icon: "text-emerald-300", ring: "hover:border-emerald-400/50", glow: "hover:shadow-[0_0_30px_rgba(52,211,153,.18)]" },
  amber: { icon: "text-amber-300", ring: "hover:border-amber-400/50", glow: "hover:shadow-[0_0_30px_rgba(252,211,77,.18)]" },
};

export default function CyberCore() {
  return (
    <div dir="rtl" className="relative min-h-screen overflow-hidden bg-[#02040d] p-5 pb-28 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(139,92,246,.16),transparent_40%),radial-gradient(circle_at_90%_10%,rgba(34,211,238,.08),transparent_35%)]" />
      <div className="relative z-10 mx-auto max-w-5xl">
        <header className="mb-8 flex items-center gap-4 rounded-[28px] border border-violet-500/20 bg-white/[.02] p-5 shadow-[0_0_50px_rgba(139,92,246,.1)] backdrop-blur-xl">
          <img src="/cyber-core-icon.png" className="h-16 w-[4.5rem] rounded-2xl border border-violet-400/30 object-cover shadow-[0_0_25px_rgba(139,92,246,.35)]" />
          <div>
            <div className="text-xs font-bold uppercase tracking-[.25em] text-cyan-300/80">مركز القيادة</div>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">CYBER CORE</h1>
            <p className="text-sm text-slate-400">كل الأشياء الأساسية في مكان واحد</p>
          </div>
        </header>

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map(({ href, icon: Icon, title, text, tone }) => {
            const t = TONE[tone];
            return (
              <Link
                key={href + title}
                href={href}
                className={cn(
                  "group rounded-2xl border border-white/[.06] bg-white/[.02] p-5 transition-all",
                  t.ring,
                  t.glow,
                )}
              >
                <div className={cn("mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[.03] transition-colors", t.icon)}>
                  <Icon className="h-5.5 w-5.5" />
                </div>
                <div className="font-bold">{title}</div>
                <div className="mt-1 text-xs text-slate-500">{text}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
