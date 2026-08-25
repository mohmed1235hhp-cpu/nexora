import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";

async function api<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return (await res.json()) as T;
}

type Summary = {
  revenue: { totalMinor: number; monthMinor: number; todayMinor: number };
  subscriptions: { active: number; expired: number };
  payments: { today: number; month: number };
};

type SeriesPoint = { day: string; total: number };

function money(m: number) {
  return `${(m / 100).toFixed(2)} $`;
}

export default function AdminPaymentsPage() {
  const summary = useQuery({ queryKey: ["admin-payments-summary"], queryFn: () => api<Summary>("/admin/payments/summary") });
  const series = useQuery({
    queryKey: ["admin-payments-series"],
    queryFn: () => api<{ series: SeriesPoint[] }>("/admin/payments/revenue-series"),
  });
  const recent = useQuery({
    queryKey: ["admin-payments-recent"],
    queryFn: () => api<{ payments: Array<{ id: number; provider: string; status: string; amountMinor: number; currency: string; createdAt: string }> }>(
      "/admin/payments/recent",
    ),
  });

  if (summary.isError) {
    return (
      <AppLayout>
        <div className="rounded-2xl border border-red-500/30 bg-red-500/[.06] p-6 text-red-300">تحتاج صلاحية المدير للوصول لهذه الصفحة.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
    <div className="mx-auto max-w-6xl" dir="rtl">
      <h1 className="text-3xl font-black tracking-tight">لوحة المدفوعات</h1>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Stat label="إجمالي الإيرادات" value={money(summary.data?.revenue.totalMinor ?? 0)} />
        <Stat label="إيرادات الشهر" value={money(summary.data?.revenue.monthMinor ?? 0)} />
        <Stat label="إيرادات اليوم" value={money(summary.data?.revenue.todayMinor ?? 0)} />
        <Stat label="اشتراكات نشطة" value={String(summary.data?.subscriptions.active ?? 0)} />
        <Stat label="اشتراكات منتهية" value={String(summary.data?.subscriptions.expired ?? 0)} />
        <Stat label="مدفوعات اليوم" value={String(summary.data?.payments.today ?? 0)} />
      </div>

      <section className="mt-8 rounded-2xl border border-violet-500/15 bg-white/[.02] p-6 shadow-[0_0_40px_rgba(139,92,246,.08)] backdrop-blur-xl">
        <h2 className="text-xl font-bold">الإيرادات — آخر 30 يومًا</h2>
        <RevenueChart points={series.data?.series ?? []} />
      </section>

      <section className="mt-8 rounded-2xl border border-violet-500/15 bg-white/[.02] p-6 shadow-[0_0_40px_rgba(139,92,246,.08)] backdrop-blur-xl">
        <h2 className="text-xl font-bold">أحدث العمليات</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-right text-muted-foreground">
              <tr>
                <th className="py-2">التاريخ</th>
                <th>المزوّد</th>
                <th>الحالة</th>
                <th>المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {recent.data?.payments.map((p) => (
                <tr key={p.id} className="border-t border-white/5">
                  <td className="py-2">{new Date(p.createdAt).toLocaleString("ar-EG")}</td>
                  <td>{p.provider}</td>
                  <td>{p.status}</td>
                  <td>{(p.amountMinor / 100).toFixed(2)} {p.currency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-violet-500/15 bg-white/[.02] p-5 shadow-[0_0_30px_rgba(139,92,246,.08)]">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-black bg-gradient-to-r from-violet-200 to-cyan-200 bg-clip-text text-transparent">{value}</div>
    </div>
  );
}

function RevenueChart({ points }: { points: SeriesPoint[] }) {
  if (points.length === 0) return <p className="mt-4 text-muted-foreground">لا توجد بيانات كافية بعد.</p>;
  const max = Math.max(...points.map((p) => Number(p.total)));
  return (
    <div className="mt-4 flex h-40 items-end gap-1">
      {points.map((p) => (
        <div
          key={p.day}
          title={`${p.day}: ${(Number(p.total) / 100).toFixed(2)} $`}
          className="w-full rounded-t bg-gradient-to-t from-violet-600 to-fuchsia-400 shadow-[0_0_10px_rgba(139,92,246,.4)]"
          style={{ height: `${max ? (Number(p.total) / max) * 100 : 0}%` }}
        />
      ))}
    </div>
  );
}
