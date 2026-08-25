import type { ReactNode, HTMLAttributes } from "react";
import { cx } from "../../utils/classnames";
export interface SkeletonTextProps extends HTMLAttributes<HTMLDivElement> { children?: ReactNode; }
export function SkeletonText({ children, className, ...rest }: SkeletonTextProps) {
  return <div className={cx("ab-skeletons ab-SkeletonText", className)} {...rest}>{children}</div>;
}
