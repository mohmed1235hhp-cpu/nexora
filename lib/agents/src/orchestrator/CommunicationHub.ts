import type { AgentMessage, MessageHandler } from "../types/message.types";

export class CommunicationHub {
  private handlers = new Map<string, Set<MessageHandler>>();
  private messageLog: AgentMessage[] = [];

  publish(msg: AgentMessage): void {
    this.messageLog.push(msg);
    const topicHandlers = this.handlers.get(msg.topic);
    if (topicHandlers) {
      for (const handler of topicHandlers) handler(msg);
    }
    // Broadcast to all if topic is "*"
    const allHandlers = this.handlers.get("*");
    if (allHandlers) {
      for (const handler of allHandlers) handler(msg);
    }
  }

  subscribe(topic: string, handler: MessageHandler): () => void {
    let set = this.handlers.get(topic);
    if (!set) {
      set = new Set();
      this.handlers.set(topic, set);
    }
    set.add(handler);
    return () => set!.delete(handler);
  }

  getMessageLog(): AgentMessage[] {
    return [...this.messageLog];
  }

  clearLog(): void {
    this.messageLog = [];
  }
}
