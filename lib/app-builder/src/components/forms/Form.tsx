import type { FormHTMLAttributes, ReactNode } from "react";
export function Form({ children, ...rest }: FormHTMLAttributes<HTMLFormElement> & { children: ReactNode }) {
  return <form className="flex flex-col gap-3" {...rest}>{children}</form>;
}
