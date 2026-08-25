import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "../../utils/classnames";
export function IconButton({ children, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return <button className={cx("inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent", className)} {...rest}>{children}</button>;
}
