import type { ReactNode, HTMLAttributes } from "react";
import { cx } from "../../utils/classnames";
export interface LineChartProps extends HTMLAttributes<HTMLDivElement> { children?: ReactNode; }
export function LineChart({ children, className, ...rest }: LineChartProps) {
  return <div className={cx("ab-charts ab-LineChart", className)} {...rest}>{children}</div>;
}
