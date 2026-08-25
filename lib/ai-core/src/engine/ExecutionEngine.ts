/** Placeholder for future scheduling/queueing logic. */
export class ExecutionEngine {
  async run<T>(fn: () => Promise<T>): Promise<T> {
    return fn();
  }
}
