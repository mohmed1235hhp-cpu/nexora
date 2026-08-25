export interface SessionInfo {
  sessionId: string;
  userId?: string;
  startedAt: number;
  metadata: Record<string, unknown>;
}

export class SessionContext {
  private sessions = new Map<string, SessionInfo>();

  create(sessionId: string, userId?: string): SessionInfo {
    const session: SessionInfo = { sessionId, userId, startedAt: Date.now(), metadata: {} };
    this.sessions.set(sessionId, session);
    return session;
  }

  get(sessionId: string): SessionInfo | undefined {
    return this.sessions.get(sessionId);
  }

  update(sessionId: string, meta: Record<string, unknown>): void {
    const s = this.sessions.get(sessionId);
    if (s) Object.assign(s.metadata, meta);
  }

  destroy(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }
}
