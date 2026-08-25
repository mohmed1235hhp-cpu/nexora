import type { ReactNode, HTMLAttributes } from "react";
import { cx } from "../../utils/classnames";
export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> { children?: ReactNode; }
export function CardBody({ children, className, ...rest }: CardBodyProps) {
  return <div className={cx("ab-cards ab-CardBody", className)} {...rest}>{children}</div>;
}
