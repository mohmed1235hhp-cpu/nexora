import type { IReportGenerator } from '../interfaces/IReportGenerator.js';
import type { BuildResult } from '../types/build.js';
import type { HostedProject } from '../types/hosting.js';
import { makeBuildReport } from './build-report.js';
import { makeDeploymentReport } from './deployment-report.js';

export class ReportGenerator implements IReportGenerator {
  buildReport(result: BuildResult) { return makeBuildReport(result); }
  deploymentReport(host: HostedProject) { return makeDeploymentReport(host); }
}
