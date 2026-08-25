import { Link } from "wouter";
import { Ghost, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div dir="rtl" className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#02040d] px-4 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(139,92,246,.20),transparent_40%)]" />
      <div className="relative z-10 w-full max-w-md rounded-[28px] border border-violet-500/20 bg-white/[.02] p-10 text-center shadow-[0_0_60px_rgba(139,92,246,.14)] backdrop-blur-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 shadow-[0_0_25px_rgba(139,92,246,.3)]">
          <Ghost className="h-8 w-8 text-violet-200" />
        </div>
        <div className="mb-1 text-xs font-bold uppercase tracking-[.2em] text-cyan-300/80">خطأ 404</div>
        <h1 className="text-2xl font-black tracking-tight">هذه الصفحة غير موجودة</h1>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          يبدو أن الرابط غير صحيح أو أن الصفحة انتقلت لمكان آخر. ارجع إلى مركز التحكم لمتابعة عملك.
        </p>
        <Link href="/">
          <Button className="mt-6 w-full h-11">
            <ArrowRight className="h-4 w-4" />
            العودة للرئيسية
          </Button>
        </Link>
      </div>
    </div>
  );
}
