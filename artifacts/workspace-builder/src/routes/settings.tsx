import { createFileRoute } from "@tanstack/react-router";
import { AppShell, useLang, useTheme } from "@/components/workspace/AppShell";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Cyber AI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, toggle } = useTheme();
  const { lang, toggle: toggleLang } = useLang();
  const ar = lang === "ar";
  const [memory, setMemory] = useState(true);
  const [notify, setNotify] = useState(true);
  const [privacy, setPrivacy] = useState<"public" | "private">("public");

  useEffect(() => {
    const m = localStorage.getItem("cyberai.memory"); if (m) setMemory(m === "1");
    const n = localStorage.getItem("cyberai.notify"); if (n) setNotify(n === "1");
    const p = localStorage.getItem("cyberai.privacy") as "public" | "private" | null; if (p) setPrivacy(p);
  }, []);
  useEffect(() => { localStorage.setItem("cyberai.memory", memory ? "1" : "0"); }, [memory]);
  useEffect(() => { localStorage.setItem("cyberai.notify", notify ? "1" : "0"); }, [notify]);
  useEffect(() => { localStorage.setItem("cyberai.privacy", privacy); }, [privacy]);

  return (
    <AppShell>
      <div dir={ar ? "rtl" : "ltr"} className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">{ar ? "الإعدادات" : "Settings"}</h1>

        <Section title={ar ? "المظهر" : "Appearance"}>
          <Row label={ar ? "الوضع الليلي" : "Dark mode"}>
            <Toggle on={theme === "dark"} onChange={toggle} />
          </Row>
          <Row label={ar ? "اللغة" : "Language"}>
            <button onClick={toggleLang} className="text-sm rounded-lg bg-secondary text-secondary-foreground px-3 py-1.5">
              {lang === "en" ? "English" : "العربية"}
            </button>
          </Row>
        </Section>

        <Section title={ar ? "الذكاء الاصطناعي" : "AI"}>
          <Row label={ar ? "ذاكرة الذكاء الاصطناعي" : "AI memory"} desc={ar ? "يتذكر تفضيلاتك عبر المشاريع." : "Remembers your preferences across projects."}>
            <Toggle on={memory} onChange={() => setMemory(!memory)} />
          </Row>
        </Section>

        <Section title={ar ? "الإشعارات والخصوصية" : "Notifications & privacy"}>
          <Row label={ar ? "الإشعارات" : "Notifications"}>
            <Toggle on={notify} onChange={() => setNotify(!notify)} />
          </Row>
          <Row label={ar ? "الملف الشخصي" : "Profile visibility"}>
            <select
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value as "public" | "private")}
              className="text-sm rounded-lg bg-secondary text-secondary-foreground px-3 py-1.5"
            >
              <option value="public">{ar ? "عام" : "Public"}</option>
              <option value="private">{ar ? "خاص" : "Private"}</option>
            </select>
          </Row>
        </Section>

        <Section title={ar ? "حول" : "About"}>
          <p className="text-sm text-muted-foreground">
            Cyber AI AI Platform · v1.0 · Phase 3 · {ar ? "تجربة مستخدم متميزة" : "Premium User Experience"}
          </p>
        </Section>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur">
      <div className="px-4 py-3 border-b border-border/60 text-xs uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="divide-y divide-border/40">{children}</div>
    </div>
  );
}

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 flex items-center gap-4">
      <div className="min-w-0 flex-1">
        <div className="text-sm">{label}</div>
        {desc && <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      aria-pressed={on}
      className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-primary" : "bg-muted"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-5" : "left-0.5"}`} />
    </button>
  );
}
