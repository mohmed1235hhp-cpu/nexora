import type { ReactNode } from "react";

export interface StatCardProps {
  children?: ReactNode;
  className?: string;
}

export function StatCard({ children, className }: StatCardProps) {
  return (
    <div className={`dashboard-statcard ${className ?? ""}`} data-template="dashboard/StatCard">
      {children}
    </div>
  );
}
