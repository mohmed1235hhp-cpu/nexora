import type { Timestamp } from "./types.js";
export interface Clock { now(): Timestamp; monotonic(): number; }
export const systemClock: Clock = {
  now: () => Date.now(),
  monotonic: () =>
    typeof performance !== "undefined" ? performance.now() : Date.now(),
};
export function fixedClock(fixed: Timestamp): Clock {
  let mono = 0;
  return { now: () => fixed, monotonic: () => ++mono };
}
