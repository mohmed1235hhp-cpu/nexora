export class CancellationController {
  private controller = new AbortController();
  get signal(): AbortSignal {
    return this.controller.signal;
  }
  cancel(reason?: string): void {
    this.controller.abort(reason);
  }
}
