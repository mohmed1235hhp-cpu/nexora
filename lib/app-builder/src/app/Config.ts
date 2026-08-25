export interface AppBuilderConfig { maxConcurrentBuilds: number; enableTests: boolean; enablePreview: boolean; }
export const defaultConfig: AppBuilderConfig = { maxConcurrentBuilds: 2, enableTests: true, enablePreview: true };
