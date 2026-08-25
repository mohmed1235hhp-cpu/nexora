import type { ReactNode } from "react";

export interface ManifestProps {
  children?: ReactNode;
  className?: string;
}

export function Manifest({ children, className }: ManifestProps) {
  return (
    <div className={`pwa-manifest ${className ?? ""}`} data-template="pwa/Manifest">
      {children}
    </div>
  );
}
