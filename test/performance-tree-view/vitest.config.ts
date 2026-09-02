import { fileURLToPath } from 'node:url';
import { mergeConfig, defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { createBenchmarkVitestConfig } from '@mui/internal-benchmark/vitest';

export default mergeConfig(
  createBenchmarkVitestConfig(),
  defineConfig({
    test: {
      setupFiles: ['./setup.ts'],
      browser: {
        // Run the full Chromium (new headless) instead of Playwright's default
        // chrome-headless-shell: the harness waits for an Element Timing paint entry after
        // every iteration, and the headless shell never presents frames on machines without
        // continuous compositing (e.g. WSL2), so every benchmark hangs until the test timeout.
        // The args mirror the harness's own LAUNCH_ARGS (not exported): `--expose-gc` is
        // required by the harness, the rest prevent throttling of the benchmark tab.
        provider: playwright({
          launchOptions: {
            channel: 'chromium',
            args: [
              '--js-flags=--expose-gc',
              '--disable-background-timer-throttling',
              '--disable-backgrounding-occluded-windows',
              '--disable-renderer-backgrounding',
            ],
          },
        }),
      },
    },
    resolve: {
      alias: [
        {
          find: 'test/utils',
          replacement: fileURLToPath(new URL('../utils', import.meta.url)),
        },
      ],
    },
  }),
);
