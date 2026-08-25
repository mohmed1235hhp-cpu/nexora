import type { ReactNode } from "react";

export interface ServiceWorkerProps {
  children?: ReactNode;
  className?: string;
}

export function ServiceWorker({ children, className }: ServiceWorkerProps) {
  return (
    <div className={`pwa-serviceworker ${className ?? ""}`} data-template="pwa/ServiceWorker">
      {children}
    </div>
  );
}
