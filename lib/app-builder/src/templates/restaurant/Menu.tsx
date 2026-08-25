import type { ReactNode } from "react";

export interface MenuProps {
  children?: ReactNode;
  className?: string;
}

export function Menu({ children, className }: MenuProps) {
  return (
    <div className={`restaurant-menu ${className ?? ""}`} data-template="restaurant/Menu">
      {children}
    </div>
  );
}
