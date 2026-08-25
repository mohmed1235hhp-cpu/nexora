import { z } from "zod";
export const sendMessage = z.object({
  conversationId: z.string().uuid(),
  body: z.string().trim().min(1).max(4000),
  attachments: z.array(z.string().uuid()).max(5).default([]),
});
export const openConversation = z.object({
  participantId: z.string().uuid(),
});
