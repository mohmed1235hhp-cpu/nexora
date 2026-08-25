export interface IdGenerator { next(prefix?: string): string; }
export function createIdGenerator(seed = 0): IdGenerator {
  let n = seed;
  return {
    next(prefix = "id") {
      n += 1;
      const rand = Math.random().toString(36).slice(2, 8);
      return `${prefix}_${Date.now().toString(36)}_${n.toString(36)}_${rand}`;
    },
  };
}
export const defaultIdGenerator = createIdGenerator();
