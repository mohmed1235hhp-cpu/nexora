export type ProjectType =
  | 'website' | 'application' | 'static'
  | 'react' | 'next' | 'vue' | 'angular' | 'flutter';

export interface ProjectSource {
  readonly id: string;
  readonly name: string;
  readonly type: ProjectType;
  readonly rootPath: string;
  readonly entry?: string;
  readonly env?: Readonly<Record<string, string>>;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface ProjectRecord extends ProjectSource {
  readonly createdAt: number;
  readonly updatedAt: number;
}
