import { describe, it, expect } from 'vitest';
import { BuildEngine } from '../src/build/engine.js';
import { BuildPipeline } from '../src/build/pipeline.js';
import { makeRequest } from './helpers.js';

describe('BuildEngine', () => {
  it('runs all pipeline stages successfully', async () => {
    const engine = new BuildEngine(new BuildPipeline());
    const result = await engine.build(makeRequest());
    expect(result.status).toBe('succeeded');
    expect(result.stages.length).toBe(14);
    expect(result.stages.every(s => s.status !== 'failed')).toBe(true);
  });
});
