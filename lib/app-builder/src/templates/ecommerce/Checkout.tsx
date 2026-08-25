import type { ReactNode } from "react";

export interface CheckoutProps {
  children?: ReactNode;
  className?: string;
}

export function Checkout({ children, className }: CheckoutProps) {
  return (
    <div className={`ecommerce-checkout ${className ?? ""}`} data-template="ecommerce/Checkout">
      {children}
    </div>
  );
}
