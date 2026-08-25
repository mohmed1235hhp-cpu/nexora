import { z } from "zod";
import type { UserRequest } from "../types";

const attachmentSchema = z.object({
  kind: z.enum(["image", "audio", "document", "url"]),
  uri: z.string().min(1).max(4096),
  mime: z.string().max(255).optional(),
  bytes: z.number().int().nonnegative().max(50 * 1024 * 1024).optional(),
});

export const userRequestSchema = z.object({
  requestId: z.string().min(1).max(128),
  sessionId: z.string().min(1).max(128),
  userId: z.string().max(128).optional(),
  input: z.string().min(1).max(64_000),
  attachments: z.array(attachmentSchema).max(10).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export function validateUserRequest(req: unknown): UserRequest {
  const parsed = userRequestSchema.parse(req);
  return parsed as UserRequest;
}

export function sanitizeOutput(text: string): string {
  // Strip control chars and any raw internal stack signatures.
  return text
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
    .replace(/\bat\s+[\w.<>/\\-]+ \([^)]+\)/g, "")
    .trim();
}
