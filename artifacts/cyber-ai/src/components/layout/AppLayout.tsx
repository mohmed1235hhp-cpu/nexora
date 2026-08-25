import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#02040d] text-foreground" dir="rtl">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_15%_0%,rgba(139,92,246,.18),transparent_40%),radial-gradient(circle_at_100%_20%,rgba(34,211,238,.10),transparent_35%),radial-gradient(circle_at_50%_100%,rgba(217,70,239,.08),transparent_40%),radial-gradient(circle_at_85%_85%,rgba(212,175,90,.14),transparent_38%)] animate-[aql-drift_28s_ease-in-out_infinite_alternate]" />
      <div className="aql-scanline pointer-events-none fixed inset-0 z-0" aria-hidden="true" />
      <Navbar />
      <Sidebar />
      <main className="relative z-10 md:ml-64 pt-16 pb-24 md:pb-8 min-h-[calc(100vh-4rem)] p-4 md:p-8">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
