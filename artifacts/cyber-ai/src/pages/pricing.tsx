import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Check } from "lucide-react";
import { csrfHeaders } from "@/lib/csrf";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";

type Plan = {
  plan: "free" | "plus" | "pro" | "business";
  name: string;
  nameAr: string;
  descriptionAr: string;
  amountMinor: number | null;
  currency: string;
  interval: string;
  featuresAr: string[];
};

type Provider = { id: string; enabled: boolean; currency: string; scope: string };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const isSafe = method === "GET" || method === "HEAD";
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(isSafe ? {} : csrfHeaders()),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return (await res.json()) as T;
}

function money(minor: number | null, currency: string) {
  if (minor == null) return "مجاني";
  return `${(minor / 100).toFixed(2)} ${currency}`;
}

export default function PricingPage() {
  const plans = useQuery({ queryKey: ["plans"], queryFn: () => api<{ plans: Plan[] }>("/payments/plans") });
  const providers = useQuery({
    queryKey: ["providers"],
    queryFn: () => api<{ providers: Provider[] }>("/payments/providers"),
  });
  const [selectedProvider, setSelectedProvider] = useState<string>("stripe");
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const first = providers.data?.providers.find((p) => p.enabled);
    if (first) setSelectedProvider(first.id);
  }, [providers.data]);

  const anyEnabled = providers.data?.providers.some((p) => p.enabled) ?? false;

  const startCheckout = async (plan: Plan["plan"]) => {
    setError(null);
    setStarting(plan);
    try {
      const idempotencyKey = `${plan}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const res = await api<{ redirectUrl: string }>("/payments/checkout", {
        method: "POST",
        body: JSON.stringify({
          plan,
          provider: selectedProvider,
          successUrl: `${window.location.origin}/billing?success=1`,
          cancelUrl: `${window.location.origin}/pricing?canceled=1`,
          idempotencyKey,
        }),
      });
      window.location.href = res.redirectUrl;
    } catch (e) {
      setError((e as Error).message);
      setStarting(null);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl" dir="rtl">
        <header className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/[.06] px-4 py-1.5 text-xs font-semibold text-violet-200">الخطط والأسعار</div>
          <h1 className="text-4xl font-black tracking-tight">اختر الخطة المناسبة لك</h1>
          <p className="mt-3 text-muted-foreground">
            كل الخطط تدعم أدوات الذكاء الاصطناعي الكاملة — الفرق في الحد الشهري والأولوية.
          </p>
        </header>

        {providers.data && (
          <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">وسيلة الدفع:</span>
            {providers.data.providers.map((p) => (
              <button
                key={p.id}
                disabled={!p.enabled}
                onClick={() => setSelectedProvider(p.id)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-semibold transition-all",
                  selectedProvider === p.id
                    ? "border-violet-400/60 bg-violet-500/15 text-violet-100 shadow-[0_0_16px_rgba(139,92,246,.25)]"
                    : "border-violet-500/15 text-slate-400",
                  !p.enabled && "cursor-not-allowed opacity-50",
                )}
                title={p.enabled ? "" : "غير مفعّل بعد — أضف مفاتيح API"}
              >
                {p.id} {p.enabled ? "" : "(قريبًا)"}
              </button>
            ))}
          </div>
        )}

        {!anyEnabled && providers.data && (
          <div className="mb-6 rounded-xl border border-amber-400/30 bg-amber-400/[.06] p-4 text-sm text-amber-200">
            لم يتم تفعيل أي مزوّد دفع بعد. أضف مفاتيح API في متغيرات البيئة على الخادم لتفعيل الشراء.
          </div>
        )}

        {error && <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/[.06] p-4 text-sm text-red-200">{error}</div>}

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {plans.data?.plans
            .slice()
            .sort((a, b) => (a.amountMinor ?? -1) - (b.amountMinor ?? -1))
            .map((p, i) => {
              const featured = p.plan === "pro";
              return (
                <article
                  key={p.plan}
                  className={cn(
                    "relative flex flex-col rounded-[24px] border p-6 backdrop-blur-xl transition-all",
                    featured
                      ? "border-violet-400/50 bg-gradient-to-b from-violet-500/[.10] to-fuchsia-500/[.04] shadow-[0_0_50px_rgba(139,92,246,.22)]"
                      : "border-violet-500/15 bg-white/[.02] hover:border-violet-400/30",
                  )}
                >
                  {featured && (
                    <div className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-600 px-3 py-1 text-[10px] font-black tracking-wide text-white shadow-[0_0_16px_rgba(139,92,246,.5)]">
                      الأكثر شيوعًا
                    </div>
                  )}
                  <h2 className="text-2xl font-black">{p.nameAr}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{p.descriptionAr}</p>
                  <div className="mt-6 text-3xl font-black">
                    {money(p.amountMinor, p.currency)}
                    {p.amountMinor != null && (
                      <span className="text-sm font-normal text-muted-foreground"> / شهر</span>
                    )}
                  </div>
                  <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                    {p.featuresAr.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        <span className="text-slate-300">{f}</span>
                      </li>
                    ))}
                  </ul>
                  {p.plan === "free" ? (
                    <Link
                      href="/billing"
                      className="mt-6 rounded-xl border border-violet-500/25 py-2.5 text-center text-sm font-semibold text-violet-200 hover:bg-violet-500/10"
                    >
                      الخطة الحالية
                    </Link>
                  ) : (
                    <button
                      disabled={!anyEnabled || starting === p.plan}
                      onClick={() => startCheckout(p.plan)}
                      className="mt-6 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(139,92,246,.35)] transition hover:shadow-[0_0_28px_rgba(139,92,246,.5)] disabled:opacity-50"
                    >
                      {starting === p.plan ? "جارٍ التحويل..." : "اشترك الآن"}
                    </button>
                  )}
                </article>
              );
            })}
        </div>
      </div>
    </AppLayout>
  );
}
