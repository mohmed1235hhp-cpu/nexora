import type { ReactNode } from "react";

export interface TableMapProps {
  children?: ReactNode;
  className?: string;
}

export function TableMap({ children, className }: TableMapProps) {
  return (
    <div className={`restaurant-tablemap ${className ?? ""}`} data-template="restaurant/TableMap">
      {children}
    </div>
  );
}
