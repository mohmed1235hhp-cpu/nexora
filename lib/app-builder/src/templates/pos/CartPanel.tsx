import type { ReactNode } from "react";

export interface CartPanelProps {
  children?: ReactNode;
  className?: string;
}

export function CartPanel({ children, className }: CartPanelProps) {
  return (
    <div className={`pos-cartpanel ${className ?? ""}`} data-template="pos/CartPanel">
      {children}
    </div>
  );
}
