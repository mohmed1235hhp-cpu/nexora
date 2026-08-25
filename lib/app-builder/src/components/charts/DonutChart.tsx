import type { ReactNode, HTMLAttributes } from "react";
import { cx } from "../../utils/classnames";
export interface DonutChartProps extends HTMLAttributes<HTMLDivElement> { children?: ReactNode; }
export function DonutChart({ children, className, ...rest }: DonutChartProps) {
  return <div className={cx("ab-charts ab-DonutChart", className)} {...rest}>{children}</div>;
}
