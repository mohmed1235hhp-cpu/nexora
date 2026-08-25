import type { ReactNode, HTMLAttributes } from "react";
import { cx } from "../../utils/classnames";
export interface BadgeProps extends HTMLAttributes<HTMLDivElement> { children?: ReactNode; }
export function Badge({ children, className, ...rest }: BadgeProps) {
  return <div className={cx("ab-badges ab-Badge", className)} {...rest}>{children}</div>;
}
