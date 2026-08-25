export class TokenAccountant {
  private totals = { prompt: 0, completion: 0 };
  add(prompt = 0, completion = 0): void {
    this.totals.prompt += prompt;
    this.totals.completion += completion;
  }
  snapshot(): { prompt: number; completion: number; total: number } {
    return { ...this.totals, total: this.totals.prompt + this.totals.completion };
  }
}
