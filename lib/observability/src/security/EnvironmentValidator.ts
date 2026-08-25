export interface EnvRequirement { readonly key: string; readonly pattern?: RegExp; readonly required?: boolean; }
export interface EnvValidationReport {
  readonly ok: boolean;
  readonly missing: readonly string[];
  readonly invalid: readonly { key: string; reason: string }[];
}

export class EnvironmentValidator {
  constructor(private readonly requirements: readonly EnvRequirement[]) {}
  validate(env: Record<string, string | undefined> = (globalThis as any)?.process?.env ?? {}): EnvValidationReport {
    const missing: string[] = [];
    const invalid: { key: string; reason: string }[] = [];
    for (const r of this.requirements) {
      const v = env[r.key];
      if (v === undefined || v === "") { if (r.required !== false) missing.push(r.key); continue; }
      if (r.pattern && !r.pattern.test(v)) invalid.push({ key: r.key, reason: `does not match ${r.pattern}` });
    }
    return { ok: missing.length === 0 && invalid.length === 0, missing, invalid };
  }
}
