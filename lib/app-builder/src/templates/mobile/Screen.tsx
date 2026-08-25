import type { ReactNode } from "react";

export interface ScreenProps {
  children?: ReactNode;
  className?: string;
}

export function Screen({ children, className }: ScreenProps) {
  return (
    <div className={`mobile-screen ${className ?? ""}`} data-template="mobile/Screen">
      {children}
    </div>
  );
}
