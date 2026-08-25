# Cyber AI Conversation History Audit

Implemented in this revision:

- Cyber Core is now a real essentials hub: Settings, Messages, AI, App, About, Privacy, Terms, and Conversation History.
- Bottom navigation:
  - AI LAB -> `/`
  - PROJECTS -> `/explore`
  - CYBER CORE -> `/cyber-core`
  - CHAT -> `/chat-history`
  - ACCOUNT -> `/me`
- Persistent per-user conversation storage:
  - `ai_conversations`
  - `ai_conversation_messages`
- Each saved assistant message records provider, model, intent and preview metadata.
- User attachments are stored as metadata on the related user message (name, MIME type, size and optional URL).
- Conversations can be listed, opened and deleted only by their owner.
- Existing conversation IDs can be reused so subsequent AI requests append to the same conversation.
- Qwen Omni media requests are also persisted with the selected Qwen model.
- The visible AI remains one Cyber AI agent; provider/model selection stays internal.
- No profile/community files were modified in this revision.

Validation:
- TypeScript/TSX syntax transpilation passed for all changed and added source files.
- Full dependency-based build/typecheck was not run because the archive does not contain `node_modules`.
