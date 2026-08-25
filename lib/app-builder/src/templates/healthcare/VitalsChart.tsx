import type { ReactNode } from "react";

export interface VitalsChartProps {
  children?: ReactNode;
  className?: string;
}

export function VitalsChart({ children, className }: VitalsChartProps) {
  return (
    <div className={`healthcare-vitalschart ${className ?? ""}`} data-template="healthcare/VitalsChart">
      {children}
    </div>
  );
}
