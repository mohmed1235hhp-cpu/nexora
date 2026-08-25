import type { ReactNode, HTMLAttributes } from "react";
import { cx } from "../../utils/classnames";
export interface ListProps extends HTMLAttributes<HTMLDivElement> { children?: ReactNode; }
export function List({ children, className, ...rest }: ListProps) {
  return <div className={cx("ab-lists ab-List", className)} {...rest}>{children}</div>;
}
