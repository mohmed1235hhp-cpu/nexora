import type { ReactNode, HTMLAttributes } from "react";
import { cx } from "../../utils/classnames";
export interface ListItemProps extends HTMLAttributes<HTMLDivElement> { children?: ReactNode; }
export function ListItem({ children, className, ...rest }: ListItemProps) {
  return <div className={cx("ab-lists ab-ListItem", className)} {...rest}>{children}</div>;
}
