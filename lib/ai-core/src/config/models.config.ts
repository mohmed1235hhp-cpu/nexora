import { PROVIDERS_CONFIG } from "./providers.config";
import type { ModelDescriptor } from "../types/model.types";

export const MODELS_CONFIG: ModelDescriptor[] = PROVIDERS_CONFIG.flatMap((p) => p.models);
