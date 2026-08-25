import type { ReactNode, HTMLAttributes } from "react";
import { cx } from "../../utils/classnames";
export interface BarChartProps extends HTMLAttributes<HTMLDivElement> { children?: ReactNode; }
export function BarChart({ children, className, ...rest }: BarChartProps) {
  return <div className={cx("ab-charts ab-BarChart", className)} {...rest}>{children}</div>;
}
