export interface ScalingDecision { readonly action: 'scale-up' | 'scale-down' | 'hold'; readonly delta: number; }
export class AutoScalingPlaceholder {
  decide(input: { currentSize: number; queueDepth: number; target: number }): ScalingDecision {
    if (input.queueDepth > input.target * 2) return { action: 'scale-up', delta: 1 };
    if (input.queueDepth === 0 && input.currentSize > input.target) return { action: 'scale-down', delta: -1 };
    return { action: 'hold', delta: 0 };
  }
}
