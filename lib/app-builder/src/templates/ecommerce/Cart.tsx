import type { ReactNode } from "react";

export interface CartProps {
  children?: ReactNode;
  className?: string;
}

export function Cart({ children, className }: CartProps) {
  return (
    <div className={`ecommerce-cart ${className ?? ""}`} data-template="ecommerce/Cart">
      {children}
    </div>
  );
}
