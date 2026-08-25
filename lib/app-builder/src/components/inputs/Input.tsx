import type { InputHTMLAttributes } from "react";
import { cx } from "../../utils/classnames";
export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx("h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring", className)} {...rest} />;
}
