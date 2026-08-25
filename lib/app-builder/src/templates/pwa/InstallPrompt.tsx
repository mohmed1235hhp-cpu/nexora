import type { ReactNode } from "react";

export interface InstallPromptProps {
  children?: ReactNode;
  className?: string;
}

export function InstallPrompt({ children, className }: InstallPromptProps) {
  return (
    <div className={`pwa-installprompt ${className ?? ""}`} data-template="pwa/InstallPrompt">
      {children}
    </div>
  );
}
