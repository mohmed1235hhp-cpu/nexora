import type { ReactNode } from "react";

export interface LayoutProps {
  children?: ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  return (
    <div className={`dashboard-layout ${className ?? ""}`} data-template="dashboard/Layout">
      {children}
    </div>
  );
}
