export class ParallelExecutor {
  async runAll<T>(tasks: Array<() => Promise<T>>, maxConcurrency: number = 5): Promise<T[]> {
    if (maxConcurrency >= tasks.length) {
      return Promise.all(tasks.map(t => t()));
    }
    const results: T[] = new Array(tasks.length);
    let index = 0;
    const workers = Array.from({ length: maxConcurrency }, async () => {
      while (index < tasks.length) {
        const current = index++;
        results[current] = await tasks[current]();
      }
    });
    await Promise.all(workers);
    return results;
  }

  async runAllSettled<T>(tasks: Array<() => Promise<T>>): Promise<PromiseSettledResult<T>[]> {
    return Promise.allSettled(tasks.map(t => t()));
  }
}
