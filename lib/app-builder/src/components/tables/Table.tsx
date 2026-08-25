import type { ReactNode, HTMLAttributes } from "react";
import { cx } from "../../utils/classnames";
export interface TableProps extends HTMLAttributes<HTMLDivElement> { children?: ReactNode; }
export function Table({ children, className, ...rest }: TableProps) {
  return <div className={cx("ab-tables ab-Table", className)} {...rest}>{children}</div>;
}
