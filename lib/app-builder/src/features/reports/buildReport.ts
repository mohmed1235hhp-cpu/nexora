import type { BuildReport } from "../../core/types";
import { uid } from "../../utils/id";
export function buildReport(input: Omit<BuildReport, "id">): BuildReport { return { id: uid("rep"), ...input }; }
