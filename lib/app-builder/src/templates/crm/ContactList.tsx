import type { ReactNode } from "react";

export interface ContactListProps {
  children?: ReactNode;
  className?: string;
}

export function ContactList({ children, className }: ContactListProps) {
  return (
    <div className={`crm-contactlist ${className ?? ""}`} data-template="crm/ContactList">
      {children}
    </div>
  );
}
