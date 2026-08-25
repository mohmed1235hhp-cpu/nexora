import { z } from "zod";
export interface FieldDef { name: string; label: string; type: "text"|"number"|"select"|"textarea"; options?: {label:string;value:string}[]; required?: boolean; }
export interface FormDef { title: string; fields: FieldDef[]; schema: z.ZodTypeAny; }
export function validate<T>(schema: z.ZodType<T>, data: unknown): { ok: true; value: T } | { ok: false; error: string } {
  const r = schema.safeParse(data);
  return r.success ? { ok: true, value: r.data } : { ok: false, error: r.error.message };
}
