import type { User } from "@workspace/db";

// express-session is not installed as a dependency, so we augment the
// Express Request directly with the `session` shape we actually use.
declare global {
  namespace Express {
    interface Request {
      session: {
        userId?: number;
        user?: Pick<User, "id" | "username" | "email" | "displayName" | "avatarUrl" | "bio" | "role" | "createdAt">;
        destroy?: (cb?: (err?: unknown) => void) => void;
        [key: string]: unknown;
      };
    }
  }
}

export {};
