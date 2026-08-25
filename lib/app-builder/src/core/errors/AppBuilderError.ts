export class AppBuilderError extends Error {
  constructor(message: string, public code: string = "APP_BUILDER_ERROR", public cause?: unknown) {
    super(message);
    this.name = "AppBuilderError";
  }
}
export class PipelineError extends AppBuilderError { constructor(m: string, c?: unknown){ super(m,"PIPELINE_ERROR",c);} }
export class AgentError extends AppBuilderError { constructor(m: string, c?: unknown){ super(m,"AGENT_ERROR",c);} }
export class ValidationError extends AppBuilderError { constructor(m: string, c?: unknown){ super(m,"VALIDATION_ERROR",c);} }
export class BuildError extends AppBuilderError { constructor(m: string, c?: unknown){ super(m,"BUILD_ERROR",c);} }
