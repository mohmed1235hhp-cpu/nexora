import type { ReactNode } from "react";

export interface ProgressProps {
  children?: ReactNode;
  className?: string;
}

export function Progress({ children, className }: ProgressProps) {
  return (
    <div className={`education-progress ${className ?? ""}`} data-template="education/Progress">
      {children}
    </div>
  );
}
