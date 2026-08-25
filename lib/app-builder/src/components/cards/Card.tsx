import type { ReactNode, HTMLAttributes } from "react";
import { cx } from "../../utils/classnames";
export interface CardProps extends HTMLAttributes<HTMLDivElement> { children?: ReactNode; }
export function Card({ children, className, ...rest }: CardProps) {
  return <div className={cx("ab-cards ab-Card", className)} {...rest}>{children}</div>;
}
