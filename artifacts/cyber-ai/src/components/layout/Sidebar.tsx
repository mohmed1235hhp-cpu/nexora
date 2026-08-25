/**
 * Phase 17/18/19 — Updated Sidebar with Analytics, Monitoring links
 */
import { Link, useLocation } from "wouter";
import {
  Home, Compass, Settings, ShieldAlert,
  LogOut, BarChart2, Search
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: "الرئيسية", href: "/" },
    { icon: Compass, label: "مستكشف", href: "/explore" },
    { icon: Search, label: "البحث", href: "/search" },
  ];

  const userItems = user ? [
    { icon: BarChart2, label: "إحصائياتي", href: "/analytics" },
    { icon: Settings, label: "الإعدادات", href: "/settings" },
  ] : [];

  const adminItems = user?.role === "admin" || user?.role === "moderator" ? [
    { icon: ShieldAlert, label: "لوحة الإدارة", href: "/admin" },
  ] : [];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 border-r border-violet-500/10 bg-[#050812]/70 backdrop-blur-xl hidden md:flex flex-col p-3 z-40">
      <nav className="flex-1 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-11 rounded-xl text-sm font-medium",
                  isActive ? "text-violet-200 bg-violet-500/15 shadow-[0_0_16px_rgba(139,92,246,.15)] hover:bg-violet-500/20" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-violet-300")} />
                {item.label}
              </Button>
            </Link>
          );
        })}

        {userItems.length > 0 && (
          <>
            <div className="my-2 border-t border-violet-500/10" />
            {userItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 h-11 rounded-xl text-sm font-medium",
                      isActive ? "text-violet-200 bg-violet-500/15 shadow-[0_0_16px_rgba(139,92,246,.15)]" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-violet-300")} />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </>
        )}

        {adminItems.length > 0 && (
          <>
            <div className="my-2 border-t border-violet-500/10" />
            {adminItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 h-11 rounded-xl text-sm font-medium",
                      isActive ? "text-orange-500 bg-orange-500/10" : "text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10"
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="mt-2 pt-3 border-t border-violet-500/10">
        {user ? (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11 text-destructive hover:bg-destructive/10 rounded-xl text-sm"
            onClick={logout}
          >
            <LogOut className="w-5 h-5" />
            تسجيل الخروج
          </Button>
        ) : (
          <div className="space-y-2">
            <Link href="/login">
              <Button variant="outline" className="w-full rounded-xl h-10 text-sm">تسجيل الدخول</Button>
            </Link>
            <Link href="/register">
              <Button className="w-full rounded-xl h-10 text-sm">إنشاء حساب</Button>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
