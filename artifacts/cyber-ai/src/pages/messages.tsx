import { Link } from "wouter";
import { ArrowRight, MessageCircle } from "lucide-react";

export default function Page() {
  return (
    <div dir="rtl" className="relative min-h-screen overflow-hidden bg-[#02040d] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(139,92,246,.18),transparent_40%),radial-gradient(circle_at_100%_20%,rgba(34,211,238,.10),transparent_35%)]" />
      <div className="relative z-10 mx-auto max-w-2xl px-6 py-10">
        <Link href="/cyber-core" className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-300 hover:text-violet-200">
          <ArrowRight className="h-4 w-4" />
          العودة لمركز التحكم
        </Link>

        <div className="mt-8 rounded-[28px] border border-violet-500/20 bg-white/[.02] p-8 shadow-[0_0_60px_rgba(139,92,246,.10)] backdrop-blur-xl">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 shadow-[0_0_25px_rgba(139,92,246,.25)]">
            <MessageCircle className="h-7 w-7 text-violet-200" />
          </div>
          <div className="mb-1 text-xs font-bold uppercase tracking-[.2em] text-cyan-300/80">صندوق الرسائل</div>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">الرسائل</h1>
          <p className="mt-4 text-sm leading-8 text-slate-400">هنا ستظهر رسائل وتنبيهات التطبيق المهمة: تحديثات على مشاريعك، ردود الوكيل على المهام الطويلة، وإشعارات حسابك.</p>

          <div className="mt-6 space-y-2.5 border-t border-white/5 pt-6">
            <div className="flex items-start gap-2.5 text-sm text-slate-300"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400 shadow-[0_0_8px_#a78bfa]" />لا توجد رسائل جديدة حاليًا</div>
            <div className="flex items-start gap-2.5 text-sm text-slate-300"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400 shadow-[0_0_8px_#a78bfa]" />ستصلك تنبيهات فور اكتمال أي مهمة</div>
            <div className="flex items-start gap-2.5 text-sm text-slate-300"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400 shadow-[0_0_8px_#a78bfa]" />يمكنك إدارة التنبيهات من الإعدادات</div>
          </div>
        </div>
      </div>
    </div>
  );
}
