/**
 * Phase 8 — Extended project detector.
 *
 * Detects React, Next.js, Vue, Angular, Flutter, React Native, Node.js,
 * Python (and vanilla static) by scanning a project's file tree.
 *
 * Runtime-agnostic: filesystem access is injected as a `FsLike` port so
 * the detector runs on Node, in tests, and in edge runtimes with a
 * virtual FS.
 */
export type DetectedType =
  | 'react' | 'next' | 'vue' | 'angular'
  | 'flutter' | 'react-native'
  | 'nodejs' | 'python' | 'static' | 'unknown';

export interface DetectionSignals {
  readonly type: DetectedType;
  readonly confidence: number; // 0..1
  readonly reasons: readonly string[];
  readonly framework?: string;
  readonly packageManager?: 'npm' | 'pnpm' | 'yarn' | 'bun';
  readonly language?: 'ts' | 'js' | 'dart' | 'python' | 'html';
}

export interface FsLike {
  readFile(path: string): Promise<string | undefined>;
  exists(path: string): Promise<boolean>;
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

const has = (pj: PackageJson, name: string): boolean =>
  Boolean(pj.dependencies?.[name] ?? pj.devDependencies?.[name] ?? pj.peerDependencies?.[name]);

export async function detectProject(root: string, fs: FsLike): Promise<DetectionSignals> {
  const reasons: string[] = [];
  const p = (rel: string): string => `${root.replace(/\/$/, '')}/${rel}`;

  // --- Flutter ---
  if (await fs.exists(p('pubspec.yaml'))) {
    const pub = await fs.readFile(p('pubspec.yaml')) ?? '';
    if (/flutter\s*:/.test(pub)) {
      reasons.push('pubspec.yaml contains flutter:');
      return { type: 'flutter', confidence: 0.98, reasons, framework: 'flutter', language: 'dart' };
    }
    reasons.push('pubspec.yaml present (Dart project)');
    return { type: 'unknown', confidence: 0.3, reasons, language: 'dart' };
  }

  // --- Python ---
  const pyMarkers = ['pyproject.toml', 'requirements.txt', 'Pipfile', 'setup.py'];
  for (const m of pyMarkers) {
    if (await fs.exists(p(m))) {
      reasons.push(`${m} found`);
      const framework = await detectPythonFramework(p(''), fs);
      return { type: 'python', confidence: 0.95, reasons, framework, language: 'python' };
    }
  }

  // --- package.json based ---
  const raw = await fs.readFile(p('package.json'));
  if (!raw) {
    if (await fs.exists(p('index.html'))) {
      reasons.push('index.html found, no package.json');
      return { type: 'static', confidence: 0.7, reasons, language: 'html' };
    }
    return { type: 'unknown', confidence: 0, reasons: ['no known project marker'] };
  }

  let pj: PackageJson;
  try { pj = JSON.parse(raw) as PackageJson; } catch { return { type: 'unknown', confidence: 0, reasons: ['invalid package.json'] }; }

  const pm = await detectPackageManager(p(''), fs);
  const language: 'ts' | 'js' = (await fs.exists(p('tsconfig.json'))) ? 'ts' : 'js';

  // React Native (must precede React — RN also depends on react)
  if (has(pj, 'react-native') || has(pj, 'expo')) {
    reasons.push('react-native/expo dependency');
    return { type: 'react-native', confidence: 0.97, reasons, framework: has(pj, 'expo') ? 'expo' : 'react-native', packageManager: pm, language };
  }

  // Next
  if (has(pj, 'next')) {
    reasons.push('next dependency');
    return { type: 'next', confidence: 0.98, reasons, framework: 'next', packageManager: pm, language };
  }

  // Angular
  if (has(pj, '@angular/core')) {
    reasons.push('@angular/core dependency');
    return { type: 'angular', confidence: 0.98, reasons, framework: 'angular', packageManager: pm, language };
  }

  // Vue / Nuxt
  if (has(pj, 'vue') || has(pj, 'nuxt')) {
    reasons.push(has(pj, 'nuxt') ? 'nuxt dependency' : 'vue dependency');
    return { type: 'vue', confidence: 0.96, reasons, framework: has(pj, 'nuxt') ? 'nuxt' : 'vue', packageManager: pm, language };
  }

  // React (including Vite/CRA/Remix/Gatsby without Next)
  if (has(pj, 'react')) {
    reasons.push('react dependency');
    const framework =
      has(pj, 'remix') ? 'remix' :
      has(pj, 'gatsby') ? 'gatsby' :
      has(pj, '@tanstack/react-router') ? 'tanstack-router' :
      has(pj, 'vite') ? 'vite-react' :
      'react';
    return { type: 'react', confidence: 0.95, reasons, framework, packageManager: pm, language };
  }

  // Node.js (server / CLI / library)
  const serverMarkers = ['express', 'fastify', 'koa', 'hono', '@nestjs/core', 'ws'];
  const nodeMarker = serverMarkers.find(m => has(pj, m));
  if (nodeMarker) {
    reasons.push(`server framework ${nodeMarker}`);
    return { type: 'nodejs', confidence: 0.92, reasons, framework: nodeMarker, packageManager: pm, language };
  }
  if (pj.scripts?.start || pj.scripts?.dev) {
    reasons.push('generic node package with start/dev script');
    return { type: 'nodejs', confidence: 0.6, reasons, packageManager: pm, language };
  }

  reasons.push('package.json found but no framework markers');
  return { type: 'nodejs', confidence: 0.4, reasons, packageManager: pm, language };
}

async function detectPackageManager(root: string, fs: FsLike): Promise<'npm' | 'pnpm' | 'yarn' | 'bun'> {
  if (await fs.exists(`${root}pnpm-lock.yaml`)) return 'pnpm';
  if (await fs.exists(`${root}bun.lockb`) || await fs.exists(`${root}bun.lock`)) return 'bun';
  if (await fs.exists(`${root}yarn.lock`)) return 'yarn';
  return 'npm';
}

async function detectPythonFramework(root: string, fs: FsLike): Promise<string | undefined> {
  const req = await fs.readFile(`${root}requirements.txt`) ?? '';
  const pj = await fs.readFile(`${root}pyproject.toml`) ?? '';
  const blob = `${req}\n${pj}`.toLowerCase();
  if (blob.includes('django')) return 'django';
  if (blob.includes('fastapi')) return 'fastapi';
  if (blob.includes('flask')) return 'flask';
  if (blob.includes('streamlit')) return 'streamlit';
  return undefined;
}

/**
 * Adapter: build a `FsLike` from Node's fs/promises. Kept in a separate
 * factory so the detector module can be used in non-Node runtimes.
 */
export function createNodeFs(fsPromises: {
  readFile: (p: string, enc: string) => Promise<string>;
  access: (p: string) => Promise<void>;
}): FsLike {
  return {
    async readFile(p) { try { return await fsPromises.readFile(p, 'utf8'); } catch { return undefined; } },
    async exists(p) { try { await fsPromises.access(p); return true; } catch { return false; } },
  };
}
