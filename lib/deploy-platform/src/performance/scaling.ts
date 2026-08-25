export interface ScalingHint { readonly desiredWorkers: number; readonly reason: string; }
export class WorkerScalingHintProvider {
  hint(input: { queueSize: number; currentWorkers: number; target: number }): ScalingHint {
    if (input.queueSize > input.target * 4) return { desiredWorkers: input.currentWorkers + 1, reason: 'high queue depth' };
    if (input.queueSize === 0 && input.currentWorkers > 1) return { desiredWorkers: input.currentWorkers - 1, reason: 'idle' };
    return { desiredWorkers: input.currentWorkers, reason: 'stable' };
  }
}
