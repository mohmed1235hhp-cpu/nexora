export class MediaError extends Error {
  constructor(public code: string, message: string, public cause?: unknown) {
    super(message);
    this.name = "MediaError";
  }
}
export class ValidationError extends MediaError {
  constructor(msg: string, cause?: unknown) { super("MEDIA_VALIDATION", msg, cause); }
}
export class ProviderError extends MediaError {
  constructor(msg: string, cause?: unknown) { super("MEDIA_PROVIDER", msg, cause); }
}
export class TimeoutError extends MediaError {
  constructor(msg: string, cause?: unknown) { super("MEDIA_TIMEOUT", msg, cause); }
}
export class UnsupportedError extends MediaError {
  constructor(msg: string, cause?: unknown) { super("MEDIA_UNSUPPORTED", msg, cause); }
}
