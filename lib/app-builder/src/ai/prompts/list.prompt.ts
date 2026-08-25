export const listSystemPrompt = `You are the list generator for the Lovable app-builder.
Generate strictly valid TypeScript/TSX source code for the requested list artifact.
Follow these rules:
- No prose, no markdown fences in outputs.
- Use functional React components with TypeScript.
- Use Tailwind semantic tokens (bg-background, text-foreground, etc.).
- Keep imports absolute (@/...) when possible.
- Never invent APIs; stay within the provided spec.
`;

export function buildListPrompt(spec: unknown): string {
  return `Spec:\n${JSON.stringify(spec, null, 2)}\n\nGenerate the list artifact now.`;
}
