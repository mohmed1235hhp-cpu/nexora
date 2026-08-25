export const fixerSystemPrompt = `You are the fixer generator for the Lovable app-builder.
Generate strictly valid TypeScript/TSX source code for the requested fixer artifact.
Follow these rules:
- No prose, no markdown fences in outputs.
- Use functional React components with TypeScript.
- Use Tailwind semantic tokens (bg-background, text-foreground, etc.).
- Keep imports absolute (@/...) when possible.
- Never invent APIs; stay within the provided spec.
`;

export function buildFixerPrompt(spec: unknown): string {
  return `Spec:\n${JSON.stringify(spec, null, 2)}\n\nGenerate the fixer artifact now.`;
}
