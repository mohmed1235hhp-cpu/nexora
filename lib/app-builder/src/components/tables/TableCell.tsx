import type { ReactNode, HTMLAttributes } from "react";
import { cx } from "../../utils/classnames";
export interface TableCellProps extends HTMLAttributes<HTMLDivElement> { children?: ReactNode; }
export function TableCell({ children, className, ...rest }: TableCellProps) {
  return <div className={cx("ab-tables ab-TableCell", className)} {...rest}>{children}</div>;
}
