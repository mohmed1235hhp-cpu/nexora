import type { FieldDef } from "../../validation/FormEngine";
import { Field } from "./Field";
import { Input } from "../inputs/Input";
import { Textarea } from "../inputs/Textarea";
import { Select } from "../inputs/Select";
export function DynamicForm({ fields, values, onChange }: { fields: FieldDef[]; values: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {fields.map((f) => (
        <Field key={f.name} label={f.label}>
          {f.type === "textarea" ? (
            <Textarea value={String(values[f.name] ?? "")} onChange={(e) => onChange({ ...values, [f.name]: e.target.value })} />
          ) : f.type === "select" ? (
            <Select value={String(values[f.name] ?? "")} onChange={(e) => onChange({ ...values, [f.name]: e.target.value })}>
              {(f.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          ) : (
            <Input type={f.type} value={String(values[f.name] ?? "")} onChange={(e) => onChange({ ...values, [f.name]: e.target.value })} />
          )}
        </Field>
      ))}
    </div>
  );
}
