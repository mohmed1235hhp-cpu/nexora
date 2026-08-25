import type { BuildReport, DeploymentReport } from '../types/report.js';
import type { BuildResult } from '../types/build.js';
import type { HostedProject } from '../types/hosting.js';
export interface IReportGenerator {
  buildReport(result: BuildResult): BuildReport;
  deploymentReport(host: HostedProject): DeploymentReport;
}
