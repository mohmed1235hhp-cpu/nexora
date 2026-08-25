import type { ReactNode } from "react";

export interface ProductCardProps {
  children?: ReactNode;
  className?: string;
}

export function ProductCard({ children, className }: ProductCardProps) {
  return (
    <div className={`ecommerce-productcard ${className ?? ""}`} data-template="ecommerce/ProductCard">
      {children}
    </div>
  );
}
