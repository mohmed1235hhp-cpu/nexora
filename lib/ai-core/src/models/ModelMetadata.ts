import type { ModelDescriptor } from "../types/model.types";

export const describeModel = (m: ModelDescriptor): string =>
  `${m.displayName} (${m.id}) — provider=${m.providerId}, caps=${m.capabilities.length}`;
