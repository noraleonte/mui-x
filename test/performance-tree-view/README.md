# Performance Tree View

Vitest browser-mode benchmarks (`*.bench.tsx`) measuring React render duration and interaction latency of the Tree View components against large trees. Powered by [`@mui/internal-benchmark`](https://github.com/mui/mui-public/tree/master/packages/benchmark).

Everything here runs locally. Nothing is uploaded anywhere unless `BENCHMARK_UPLOAD=true` is set explicitly (there is no CI job for this suite).

## Run locally

Build the libraries first — benchmarks resolve from `build/`:

```bash
pnpm --filter "@mui/x-tree-view-pro..." build
```

Then run the benchmarks:

```bash
pnpm test:tree-view-benchmark
```

Or filter the workspace directly:

```bash
pnpm --filter "@mui-x-internal/performance-tree-view" test:performance
```

Every run is saved to its own dated file — `benchmarks/<date>_<branch>_<sha>.json` — so history is kept across runs (the folder is gitignored, so it stays on your machine). The newest run is also copied to `benchmarks/results.json`, which the docs playground page displays. Note that partial runs (e.g. filtering to one file) also become the "latest", so the playground may show fewer benchmarks after one.

Setting `BENCHMARK_OUTPUT_PATH=<path>` disables the automatic naming and writes only to that path.

## Compare against a baseline

This is the workflow for verifying a performance refactor. Run the baseline branch first into a separate file, then run the head with `BENCHMARK_BASELINE_PATH` pointing at it:

```bash
BENCHMARK_OUTPUT_PATH=/tmp/base.json pnpm test:tree-view-benchmark
# switch branch / commit, rebuild
BENCHMARK_BASELINE_PATH=/tmp/base.json pnpm test:tree-view-benchmark
```

## Profile a specific case

Opens a headed browser with DevTools and a toolbar to mount/unmount and re-run the interaction manually:

```bash
BENCHMARK_PROFILE=true pnpm --filter "@mui-x-internal/performance-tree-view" test:performance -t "ArrowDown"
```

## Add a benchmark

Drop a `*.bench.tsx` file in `tests/`. Shared tree fixtures live in `test/utils/tree-view/buildTreeViewItems.ts`:

```tsx
import * as React from 'react';
import { benchmark } from '@mui/internal-benchmark';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { buildBalanced1K } from 'test/utils/tree-view/buildTreeViewItems';

const fixture = buildBalanced1K();

benchmark('RichTreeView - 1,000 items', () => (
  <RichTreeView items={fixture.items} defaultExpandedItems={fixture.defaultExpandedItems} />
));
```

For interaction benchmarks (measuring only what happens after mount), pass an interaction callback and start with recording paused:

```tsx
benchmark(
  'expand a branch',
  () => <RichTreeView items={fixture.items} />,
  async ({ resumeReactRecording }) => {
    resumeReactRecording();
    document.querySelector<HTMLElement>('.MuiTreeItem-content')!.click();
  },
  { reactRecordingPaused: true },
);
```

See the harness README for custom metrics (`ScalarMetric`, `DiscreteMetric`) and paint timings (`ElementTiming`).

## Related

The Tree View also has in-package micro-benchmarks for store, selector and items-processing code that need no build and no browser:

```bash
pnpm --filter @mui/x-tree-view bench:jsdom
```
