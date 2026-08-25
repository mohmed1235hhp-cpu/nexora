import type { ReactNode } from "react";

export interface OrderTicketProps {
  children?: ReactNode;
  className?: string;
}

export function OrderTicket({ children, className }: OrderTicketProps) {
  return (
    <div className={`restaurant-orderticket ${className ?? ""}`} data-template="restaurant/OrderTicket">
      {children}
    </div>
  );
}
