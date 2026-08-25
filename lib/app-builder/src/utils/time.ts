export const now = () => Date.now();
export const fmtMs = (ms: number) => ms < 1000 ? `${ms}ms` : `${(ms/1000).toFixed(2)}s`;
