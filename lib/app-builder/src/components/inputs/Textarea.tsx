import type { TextareaHTMLAttributes } from "react";
import { cx } from "../../utils/classnames";
export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx("min-h-24 w-full rounded-md border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring", className)} {...rest} />;
}
