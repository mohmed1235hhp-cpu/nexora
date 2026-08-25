import type { TaskType } from "../types/task.types";
import type { Capability } from "../types/capability.types";

/** Maps a task to the capability required to serve it. */
export class RouteResolver {
  resolveCapability(task: TaskType): Capability {
    return task as Capability;
  }
}
