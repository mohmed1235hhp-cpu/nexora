import { UserLimiter } from "./UserLimiter";
import { TaskLimiter } from "./TaskLimiter";
import { ProviderLimiter } from "./ProviderLimiter";
import { GlobalLimiter } from "./GlobalLimiter";
import { LIMITS_CONFIG } from "../config/limits.config";
import { AIError, AIErrorCode } from "../types/error.types";
import type { AIRequest } from "../types/request.types";

export class RateLimiter {
  readonly user = new UserLimiter(LIMITS_CONFIG.perUser.requestsPerMinute);
  readonly task = new TaskLimiter(LIMITS_CONFIG.perTask.requestsPerMinute);
  readonly provider = new ProviderLimiter(LIMITS_CONFIG.perProvider.requestsPerMinute);
  readonly global = new GlobalLimiter(LIMITS_CONFIG.global.requestsPerMinute);

  enforce(req: AIRequest): void {
    if (!this.global.allow()) throw new AIError(AIErrorCode.RateLimited, "Global rate limit exceeded");
    if (req.meta?.userId && !this.user.allow(req.meta.userId))
      throw new AIError(AIErrorCode.RateLimited, "User rate limit exceeded");
    if (!this.task.allow(req.task)) throw new AIError(AIErrorCode.RateLimited, "Task rate limit exceeded");
    if (req.providerId && !this.provider.allow(req.providerId))
      throw new AIError(AIErrorCode.RateLimited, "Provider rate limit exceeded");
  }
}
