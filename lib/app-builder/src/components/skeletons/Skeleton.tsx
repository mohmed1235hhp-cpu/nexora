import type { ReactNode, HTMLAttributes } from "react";
import { cx } from "../../utils/classnames";
export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> { children?: ReactNode; }
export function Skeleton({ children, className, ...rest }: SkeletonProps) {
  return <div className={cx("ab-skeletons ab-Skeleton", className)} {...rest}>{children}</div>;
}
