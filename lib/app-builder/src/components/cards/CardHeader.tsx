import type { ReactNode, HTMLAttributes } from "react";
import { cx } from "../../utils/classnames";
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> { children?: ReactNode; }
export function CardHeader({ children, className, ...rest }: CardHeaderProps) {
  return <div className={cx("ab-cards ab-CardHeader", className)} {...rest}>{children}</div>;
}
