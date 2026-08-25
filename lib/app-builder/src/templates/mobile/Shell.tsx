import type { ReactNode } from "react";

export interface ShellProps {
  children?: ReactNode;
  className?: string;
}

export function Shell({ children, className }: ShellProps) {
  return (
    <div className={`mobile-shell ${className ?? ""}`} data-template="mobile/Shell">
      {children}
    </div>
  );
}
