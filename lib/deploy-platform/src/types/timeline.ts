export interface TimelineEvent {
  readonly id: string;
  readonly buildId: string;
  readonly ts: number;
  readonly icon: string;
  readonly label: string;
  readonly detail?: string;
  readonly stage?: string;
}
