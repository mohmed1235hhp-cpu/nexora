import { describe, it, expect } from 'vitest';
import { detectProject, type FsLike } from '../src/detector/ProjectDetector.js';

function makeFs(files: Record<string, string>): FsLike {
  return {
    async readFile(p) { return files[p]; },
    async exists(p) { return p in files; },
  };
}

describe('detectProject', () => {
  it('detects Next.js', async () => {
    const fs = makeFs({
      '/p/package.json': JSON.stringify({ dependencies: { next: '14', react: '18' } }),
    });
    const r = await detectProject('/p', fs);
    expect(r.type).toBe('next');
    expect(r.confidence).toBeGreaterThan(0.9);
  });

  it('detects React Native before React', async () => {
    const fs = makeFs({
      '/p/package.json': JSON.stringify({ dependencies: { react: '18', 'react-native': '0.73' } }),
    });
    const r = await detectProject('/p', fs);
    expect(r.type).toBe('react-native');
  });

  it('detects Flutter via pubspec.yaml', async () => {
    const fs = makeFs({ '/p/pubspec.yaml': 'name: x\nflutter:\n  sdk: flutter\n' });
    const r = await detectProject('/p', fs);
    expect(r.type).toBe('flutter');
  });

  it('detects Python + framework', async () => {
    const fs = makeFs({ '/p/requirements.txt': 'fastapi==0.111.0\nuvicorn' });
    const r = await detectProject('/p', fs);
    expect(r.type).toBe('python');
    expect(r.framework).toBe('fastapi');
  });

  it('detects Vue via nuxt', async () => {
    const fs = makeFs({ '/p/package.json': JSON.stringify({ dependencies: { nuxt: '3' } }) });
    const r = await detectProject('/p', fs);
    expect(r.type).toBe('vue');
    expect(r.framework).toBe('nuxt');
  });

  it('returns static for pure index.html', async () => {
    const fs = makeFs({ '/p/index.html': '<html></html>' });
    const r = await detectProject('/p', fs);
    expect(r.type).toBe('static');
  });
});
