export class VariableResolver {
  resolve(vars: Record<string, unknown>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(vars)) out[k] = String(v);
    return out;
  }
}
