import type { BuildRequest } from '../src/types/build.js';
import { newId } from '../src/utils/id.js';
export function makeRequest(overrides: Partial<BuildRequest> = {}): BuildRequest {
  const id = overrides.id ?? newId('build');
  return {
    id,
    project: overrides.project ?? { id: 'p1', name: 'demo', type: 'static', rootPath: '/tmp/demo' },
    priority: overrides.priority ?? 'normal',
    requestedAt: Date.now(),
  };
}
