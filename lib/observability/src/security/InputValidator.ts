import type { SchemaLike, ValidationResult } from "./types.js";

/** Wraps any zod-compatible schema and returns a uniform ValidationResult. */
export class InputValidator {
  parse<T>(schema: SchemaLike<T>, input: unknown): ValidationResult<T> {
    const r = schema.safeParse(input);
    if (r.success) return { ok: true, value: r.data };
    return { ok: false, issues: r.error.issues.map(i => ({ path: i.path.join("."), message: i.message })) };
  }

  /** Basic sanitizer: strip control chars, trim, coerce nullish to empty. */
  sanitizeString(v: unknown, opts: { max?: number } = {}): string {
    let s = v == null ? "" : String(v);
    // eslint-disable-next-line no-control-regex
    s = s.replace(/[\u0000-\u001F\u007F]/g, "").trim();
    if (opts.max && s.length > opts.max) s = s.slice(0, opts.max);
    return s;
  }
}
