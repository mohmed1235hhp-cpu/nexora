import type { ReactNode } from "react";

export interface MenuBarProps {
  children?: ReactNode;
  className?: string;
}

export function MenuBar({ children, className }: MenuBarProps) {
  return (
    <div className={`desktop-menubar ${className ?? ""}`} data-template="desktop/MenuBar">
      {children}
    </div>
  );
}
