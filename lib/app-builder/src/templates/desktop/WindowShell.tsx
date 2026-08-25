import type { ReactNode } from "react";

export interface WindowShellProps {
  children?: ReactNode;
  className?: string;
}

export function WindowShell({ children, className }: WindowShellProps) {
  return (
    <div className={`desktop-windowshell ${className ?? ""}`} data-template="desktop/WindowShell">
      {children}
    </div>
  );
}
