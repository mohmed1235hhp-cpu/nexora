import type { ReactNode } from "react";

export interface ChartPanelProps {
  children?: ReactNode;
  className?: string;
}

export function ChartPanel({ children, className }: ChartPanelProps) {
  return (
    <div className={`dashboard-chartpanel ${className ?? ""}`} data-template="dashboard/ChartPanel">
      {children}
    </div>
  );
}
