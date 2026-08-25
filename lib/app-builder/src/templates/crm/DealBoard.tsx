import type { ReactNode } from "react";

export interface DealBoardProps {
  children?: ReactNode;
  className?: string;
}

export function DealBoard({ children, className }: DealBoardProps) {
  return (
    <div className={`crm-dealboard ${className ?? ""}`} data-template="crm/DealBoard">
      {children}
    </div>
  );
}
