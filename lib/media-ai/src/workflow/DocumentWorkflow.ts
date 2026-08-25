import { WorkflowEngine } from "./WorkflowEngine.js";
import { ReceiveRequestStep, AnalyzeStep, ExecuteStep, GenerateResultStep, SaveHistoryStep, GenerateReportStep } from "./steps/index.js";
export const documentWorkflow = new WorkflowEngine<Record<string, unknown>>([
  ReceiveRequestStep, AnalyzeStep, ExecuteStep, GenerateResultStep, SaveHistoryStep, GenerateReportStep,
]);
