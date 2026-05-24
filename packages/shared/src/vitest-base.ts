import { defineConfig, type ViteUserConfig } from 'vitest/config';

const COVERAGE_THRESHOLD = 80;

export type VitestEnvironment = 'node' | 'happy-dom' | 'jsdom';

interface BaseOptions {
  readonly environment: VitestEnvironment;
  readonly include?: readonly string[];
  readonly plugins?: ViteUserConfig['plugins'];
}

export function defineSharedVitestConfig(options: BaseOptions): ViteUserConfig {
  return defineConfig({
    plugins: [...(options.plugins ?? [])],
    test: {
      environment: options.environment,
      include: [...(options.include ?? ['src/**/*.test.ts'])],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        thresholds: {
          lines: COVERAGE_THRESHOLD,
          functions: COVERAGE_THRESHOLD,
          statements: COVERAGE_THRESHOLD,
          branches: COVERAGE_THRESHOLD,
        },
      },
    },
  });
}
