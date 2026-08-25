import type { ReactNode, HTMLAttributes } from "react";
import { cx } from "../../utils/classnames";
export interface TableRowProps extends HTMLAttributes<HTMLDivElement> { children?: ReactNode; }
export function TableRow({ children, className, ...rest }: TableRowProps) {
  return <div className={cx("ab-tables ab-TableRow", className)} {...rest}>{children}</div>;
}
