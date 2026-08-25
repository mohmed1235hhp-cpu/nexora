import type { MediaAIRouter } from "../router/MediaAIRouter.js";
export interface AgentContext { router: MediaAIRouter; requestId: string; }
export abstract class BaseMediaAgent<Req, Res> {
  abstract readonly name: string;
  abstract run(req: Req, ctx: AgentContext): Promise<Res>;
}
