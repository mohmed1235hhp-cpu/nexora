import type { DeploymentReport } from '../types/report.js';
import type { HostedProject } from '../types/hosting.js';
import { newId } from '../utils/id.js';
export function makeDeploymentReport(host: HostedProject, notes?: string): DeploymentReport {
  return {
    id: newId('dep'), buildId: host.buildId, projectId: host.projectId,
    internalUrl: host.internalUrl, deployedAt: Date.now(), notes,
  };
}
