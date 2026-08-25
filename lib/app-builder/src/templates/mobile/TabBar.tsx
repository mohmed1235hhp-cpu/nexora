import type { ReactNode } from "react";

export interface TabBarProps {
  children?: ReactNode;
  className?: string;
}

export function TabBar({ children, className }: TabBarProps) {
  return (
    <div className={`mobile-tabbar ${className ?? ""}`} data-template="mobile/TabBar">
      {children}
    </div>
  );
}
