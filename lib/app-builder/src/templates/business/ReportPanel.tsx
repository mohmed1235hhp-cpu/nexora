import type { ReactNode } from "react";

export interface ReportPanelProps {
  children?: ReactNode;
  className?: string;
}

export function ReportPanel({ children, className }: ReportPanelProps) {
  return (
    <div className={`business-reportpanel ${className ?? ""}`} data-template="business/ReportPanel">
      {children}
    </div>
  );
}
