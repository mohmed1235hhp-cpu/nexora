import type { ReactNode } from "react";

export interface SidebarProps {
  children?: ReactNode;
  className?: string;
}

export function Sidebar({ children, className }: SidebarProps) {
  return (
    <div className={`desktop-sidebar ${className ?? ""}`} data-template="desktop/Sidebar">
      {children}
    </div>
  );
}
