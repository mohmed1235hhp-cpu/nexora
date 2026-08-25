import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Folder, Home, Moon, Sun, Settings as SettingsIcon, User, Languages, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const THEME_KEY = "cyberai.theme";
const LANG_KEY = "cyberai.lang";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  useEffect(() => {
    const stored = (typeof window !== "undefined" && window.localStorage.getItem(THEME_KEY)) as "light" | "dark" | null;
    const initial = stored ?? "dark";
    setTheme(initial);
  }, []);
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);
  return { theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) };
}

export function useLang() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  useEffect(() => {
    const stored = (typeof window !== "undefined" && window.localStorage.getItem(LANG_KEY)) as "en" | "ar" | null;
    setLang(stored ?? "en");
  }, []);
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    window.localStorage.setItem(LANG_KEY, lang);
  }, [lang]);
  return { lang, toggle: () => setLang((l) => (l === "en" ? "ar" : "en")) };
}

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  const { lang, toggle: toggleLang } = useLang();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const ar = lang === "ar";

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      {/* Ambient identity layer — obsidian void + molten gold + neural violet aurora */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="aql-grid" aria-hidden="true" />
        <div className="absolute -top-40 -left-40 h-[560px] w-[560px] rounded-full bg-primary/20 blur-[130px] animate-[aql-drift_26s_ease-in-out_infinite_alternate]" />
        <div className="absolute top-1/3 -right-40 h-[560px] w-[560px] rounded-full bg-[oklch(0.65_0.23_300)]/20 blur-[130px] animate-[aql-drift_22s_ease-in-out_infinite_alternate_-9s]" />
        <div className="absolute bottom-0 left-1/3 h-[420px] w-[420px] rounded-full bg-chart-2/15 blur-[130px]" />
      </div>

      <header className="sticky top-0 z-30 border-b border-primary/15 bg-background/50 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link to="/" className="font-display font-extrabold tracking-tight text-base sm:text-lg flex items-center gap-2">
            <span className="grid place-items-center h-8 w-8 rounded-lg aql-glow-ring bg-gradient-to-br from-[oklch(0.82_0.15_85)] to-[oklch(0.6_0.2_300)] text-[oklch(0.1_0.02_280)] text-sm font-black">
              ع
            </span>
            <span className="aql-gradient-text">AQL</span>
            <span className="text-muted-foreground font-normal text-sm hidden sm:inline"> · Cyber AI Workspace</span>
          </Link>
          <nav className="ms-auto flex items-center gap-1">
            <NavLink to="/" icon={<Home className="h-4 w-4" />} label={ar ? "الرئيسية" : "Home"} />
            <NavLink to="/projects" icon={<Folder className="h-4 w-4" />} label={ar ? "المشاريع" : "Projects"} />
            <NavLink to="/profile" icon={<User className="h-4 w-4" />} label={ar ? "الحساب" : "Profile"} />
            <NavLink to="/settings" icon={<SettingsIcon className="h-4 w-4" />} label={ar ? "الإعدادات" : "Settings"} />
            <button
              onClick={toggleLang}
              aria-label="Language"
              className="h-9 px-2.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition flex items-center gap-1 text-xs"
            >
              <Languages className="h-4 w-4" />
              <span className="hidden sm:inline">{lang.toUpperCase()}</span>
            </button>
            <button
              onClick={toggle}
              aria-label="Theme"
              className="h-9 w-9 grid place-items-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {!isLoading && (
              isAuthenticated ? (
                <div className="ms-1 flex items-center gap-1.5 border-s border-border/60 ps-2">
                  <span className="hidden lg:inline text-xs text-muted-foreground max-w-[9rem] truncate">
                    {user?.displayName || user?.username}
                  </span>
                  <button
                    onClick={() => logout()}
                    aria-label={ar ? "تسجيل الخروج" : "Log out"}
                    title={ar ? "تسجيل الخروج" : "Log out"}
                    className="h-9 w-9 grid place-items-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive transition"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Link to="/login" className="ms-1">
                  <Button variant="glow" size="sm">{ar ? "دخول" : "Sign in"}</Button>
                </Link>
              )
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">{children}</main>
    </div>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link
      to={to}
      activeProps={{ className: "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_oklch(0.8_0.15_85_/_0.3)]" }}
      className="h-9 px-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition flex items-center gap-1.5"
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </Link>
  );
}
