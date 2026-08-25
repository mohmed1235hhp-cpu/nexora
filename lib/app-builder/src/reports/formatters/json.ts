import type { FinalReport } from "../FinalReport";
export function toJson(r: FinalReport): string { return JSON.stringify(r, null, 2); }
