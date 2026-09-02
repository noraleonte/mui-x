/**
 * Runs the benchmark suite and saves the results to a dated file:
 *   benchmarks/<date>_<branch>_<sha>.json
 * so every run is kept as history (the folder is gitignored, so it stays local).
 *
 * The newest results are also copied to benchmarks/results.json, which the
 * docs playground page reads to display the latest run.
 *
 * Setting BENCHMARK_OUTPUT_PATH explicitly disables the automatic naming and
 * behaves like calling vitest directly. BENCHMARK_BASELINE_PATH passes through
 * untouched, so baseline comparisons keep working.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDir = dirname(dirname(fileURLToPath(import.meta.url)));

function git(args) {
  try {
    return execFileSync('git', args, { cwd: packageDir, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

const explicitOutput = process.env.BENCHMARK_OUTPUT_PATH;
let outputPath = explicitOutput;
if (!outputPath) {
  const date = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']).replace(/[^\w.-]+/g, '-');
  const sha = git(['rev-parse', '--short', 'HEAD']);
  outputPath = join('benchmarks', `${date}_${branch}_${sha}.json`);
}

mkdirSync(join(packageDir, 'benchmarks'), { recursive: true });

const result = spawnSync('vitest', ['run', ...process.argv.slice(2)], {
  cwd: packageDir,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, BENCHMARK_OUTPUT_PATH: outputPath },
});

if (result.status === 0 && !explicitOutput) {
  copyFileSync(join(packageDir, outputPath), join(packageDir, 'benchmarks', 'results.json'));
  // eslint-disable-next-line no-console
  console.log(
    `\nSaved this run to ${outputPath} (also copied to benchmarks/results.json for the playground page).`,
  );
}

process.exit(result.status ?? 1);
