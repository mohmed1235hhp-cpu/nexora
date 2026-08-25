import type { ReactNode } from "react";

export interface ComposerProps {
  children?: ReactNode;
  className?: string;
}

export function Composer({ children, className }: ComposerProps) {
  return (
    <div className={`chat-composer ${className ?? ""}`} data-template="chat/Composer">
      {children}
    </div>
  );
}
