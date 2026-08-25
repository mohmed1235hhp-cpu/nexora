import { Link, useLocation } from "wouter";
import { Atom, FolderKanban, BrainCircuit, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    icon: Atom,
    label: "AI LAB",
    href: "/",
    color: "text-violet-300",
    activeGlow: "shadow-[0_0_18px_rgba(167,139,250,.55)] border-violet-400/60 bg-violet-500/15",
  },
  {
    icon: FolderKanban,
    label: "PROJECTS",
    href: "/explore",
    color: "text-cyan-300",
    activeGlow: "shadow-[0_0_18px_rgba(34,211,238,.55)] border-cyan-400/60 bg-cyan-500/15",
  },
  {
    icon: BrainCircuit,
    label: "CYBER CORE",
    href: "/cyber-core",
    color: "text-fuchsia-300",
    activeGlow: "shadow-[0_0_18px_rgba(232,121,249,.55)] border-fuchsia-400/60 bg-fuchsia-500/15",
    center: true,
  },
  {
    icon: MessageCircle,
    label: "CHAT",
    href: "/chat-history",
    color: "text-emerald-300",
    activeGlow: "shadow-[0_0_18px_rgba(52,211,153,.55)] border-emerald-400/60 bg-emerald-500/15",
  },
  {
    icon: User,
    label: "ACCOUNT",
    href: "/settings",
    color: "text-amber-300",
    activeGlow: "shadow-[0_0_18px_rgba(252,211,77,.55)] border-amber-400/60 bg-amber-500/15",
  },
];

export function BottomNav() {
  const [location] = useLocation();
  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex items-end justify-around gap-1.5 border-t border-white/5 bg-[#050812]/95 px-2 pb-2 pt-3 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl border border-transparent py-2 text-[9px] font-bold tracking-wide transition-all",
              item.center && "-translate-y-3 border-fuchsia-400/30 bg-gradient-to-b from-fuchsia-500/20 to-violet-600/10 px-2 py-3 shadow-[0_0_28px_rgba(217,70,239,.35)]",
              isActive ? cn(item.color, item.activeGlow) : "text-slate-500 hover:text-slate-300",
            )}
          >
            <item.icon className={cn(item.center ? "h-6 w-6" : "h-5 w-5", isActive && item.color)} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
