import type { ReactNode, HTMLAttributes } from "react";
import { cx } from "../../utils/classnames";
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> { children?: ReactNode; }
export function CardFooter({ children, className, ...rest }: CardFooterProps) {
  return <div className={cx("ab-cards ab-CardFooter", className)} {...rest}>{children}</div>;
}
