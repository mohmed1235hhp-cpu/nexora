export interface AgentMessage<TPayload = unknown> {
  id: string;
  from: string;
  to?: string;
  topic: string;
  payload: TPayload;
  timestamp: number;
}

export type MessageHandler<T = unknown> = (msg: AgentMessage<T>) => void;
