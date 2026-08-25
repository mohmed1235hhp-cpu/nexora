import type { ReactNode } from "react";
export function Protected({ children, allow = true, fallback = null }: { children: ReactNode; allow?: boolean; fallback?: ReactNode }) {
  return <>{allow ? children : fallback}</>;
}
