import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { csrfHeaders } from "@/lib/csrf";
import { AppLayout } from "@/components/layout/AppLayout";

type Invoice = {
  id: number;
  number: string;
  status: string;
  amountMinor: number;
  totalMinor: number;
  currency: string;
  paidAt: string | null;
  createdAt: string;
};

type Payment = {
  id: number;
  provider: string;
  status: string;
  amountMinor: number;
  currency: string;
  createdAt: string;
  providerPaymentId: string | null;
};

type Subscription = {
  id: number;
  plan: string;
  status: string;
  provider: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  autoRenew: boolean;
  canceledAt: string | null;
} | null;

async function api<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return (await res.json()) as T;
}

function money(m: number, c: string) {
  return `${(m / 100).toFixed(2)} ${c}`;
}
function date(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("ar-EG") : "-";
}

export default function BillingPage() {
  const sub = useQuery({ queryKey: ["subscription"], queryFn: () => api<{ subscription: Subscription }>("/payments/subscription") });
  const invoices = useQuery({ queryKey: ["invoices"], queryFn: () => api<{ items: Invoice[] }>("/payments/invoices") });
  const history = useQuery({ queryKey: ["payment-history"], queryFn: () => api<{ items: Payment[] }>("/payments/history") });

  const cancelSub = async () => {
    if (!confirm("هل تريد إلغاء الاشتراك في نهاية الفترة الحالية؟")) return;
    await fetch("/api/payments/subscription/cancel", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...csrfHeaders() },
      body: JSON.stringify({ immediately: false }),
    });
    sub.refetch();
  };

  return (
    <AppLayout>
    <div className="mx-auto max-w-5xl" dir="rtl">
      <h1 className="text-3xl font-black tracking-tight">الفواتير والاشتراك</h1>

      <section className="mt-8 rounded-2xl border border-violet-500/15 bg-white/[.02] p-6 shadow-[0_0_40px_rgba(139,92,246,.08)] backdrop-blur-xl">
        <h2 className="text-xl font-bold">اشتراكي الحالي</h2>
        {sub.isLoading ? (
          <p className="mt-2 text-muted-foreground">جارٍ التحميل...</p>
        ) : sub.data?.subscription ? (
          <div className="mt-4 grid gap-4 text-sm md:grid-cols-3">
            <Info label="الخطة" value={sub.data.subscription.plan} />
            <Info label="الحالة" value={sub.data.subscription.status} />
            <Info label="المزوّد" value={sub.data.subscription.provider} />
            <Info label="بداية الفترة" value={date(sub.data.subscription.currentPeriodStart)} />
            <Info label="نهاية الفترة" value={date(sub.data.subscription.currentPeriodEnd)} />
            <Info label="تجديد تلقائي" value={sub.data.subscription.autoRenew ? "نعم" : "لا"} />
            <div className="md:col-span-3">
              {sub.data.subscription.autoRenew && sub.data.subscription.status === "active" && (
                <button onClick={cancelSub} className="rounded-xl border border-red-500/40 bg-red-500/[.06] px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10">
                  إلغاء الاشتراك
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-muted-foreground">لا يوجد اشتراك نشط.</p>
            <Link href="/pricing" className="rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 px-4 py-2 text-sm font-bold text-white shadow-[0_0_20px_rgba(139,92,246,.35)]">
              اختر خطة
            </Link>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-violet-500/15 bg-white/[.02] p-6 shadow-[0_0_40px_rgba(139,92,246,.08)] backdrop-blur-xl">
        <h2 className="text-xl font-bold">الفواتير</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-right text-muted-foreground">
              <tr>
                <th className="py-2">الرقم</th>
                <th>التاريخ</th>
                <th>المبلغ</th>
                <th>الحالة</th>
                <th>PDF</th>
              </tr>
            </thead>
            <tbody>
              {invoices.data?.items.length ? (
                invoices.data.items.map((inv) => (
                  <tr key={inv.id} className="border-t border-white/5">
                    <td className="py-2 font-mono">{inv.number}</td>
                    <td>{date(inv.createdAt)}</td>
                    <td>{money(inv.totalMinor, inv.currency)}</td>
                    <td>{inv.status}</td>
                    <td>
                      <a href={`/api/payments/invoices/${inv.id}/pdf`} className="font-semibold text-cyan-300 underline hover:text-cyan-200">
                        تحميل
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-muted-foreground">
                    لا توجد فواتير بعد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-violet-500/15 bg-white/[.02] p-6 shadow-[0_0_40px_rgba(139,92,246,.08)] backdrop-blur-xl">
        <h2 className="text-xl font-bold">سجل المدفوعات</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-right text-muted-foreground">
              <tr>
                <th className="py-2">التاريخ</th>
                <th>المزوّد</th>
                <th>رقم العملية</th>
                <th>المبلغ</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {history.data?.items.length ? (
                history.data.items.map((p) => (
                  <tr key={p.id} className="border-t border-white/5">
                    <td className="py-2">{date(p.createdAt)}</td>
                    <td>{p.provider}</td>
                    <td className="font-mono text-xs">{p.providerPaymentId ?? "-"}</td>
                    <td>{money(p.amountMinor, p.currency)}</td>
                    <td>{p.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-muted-foreground">
                    لا توجد عمليات دفع بعد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
    </AppLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-violet-500/15 bg-white/[.02] p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
