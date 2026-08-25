import { WorkflowEngine } from "./WorkflowEngine.js";
import {
  ReceiveRequestStep, AnalyzeStep, PlanningStep, SelectAgentStep,
  ExecuteStep, ReviewStep, FixErrorsStep, GenerateResultStep,
  SaveHistoryStep, GenerateReportStep,
} from "./steps/index.js";
export const imageWorkflow = new WorkflowEngine<Record<string, unknown>>([
  ReceiveRequestStep, AnalyzeStep, PlanningStep, SelectAgentStep,
  ExecuteStep, ReviewStep, FixErrorsStep, GenerateResultStep,
  SaveHistoryStep, GenerateReportStep,
]);
