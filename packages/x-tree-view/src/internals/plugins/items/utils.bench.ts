import { bench, describe } from 'vitest';
import {
  buildBalanced10K,
  buildDeep2K,
  buildFlat10K,
} from 'test/utils/tree-view/buildTreeViewItems';
import { TreeViewItemsPlugin } from './TreeViewItemsPlugin';

const flat10k = buildFlat10K();
const balanced10k = buildBalanced10K();
const deep2k = buildDeep2K();

const flat10kWithOneChange = [...flat10k.items];
const changedIndex = Math.floor(flat10k.items.length / 2);
flat10kWithOneChange[changedIndex] = {
  ...flat10kWithOneChange[changedIndex],
  label: 'Updated item',
};

// Defeats dead-code elimination of the benched calls.
export const benchmarkResult = { value: undefined as unknown };

describe('buildItemsStateIfNeeded', () => {
  bench('flat 10,000 items — fresh build', () => {
    benchmarkResult.value = TreeViewItemsPlugin.buildItemsStateIfNeeded({ items: flat10k.items });
  });

  bench('balanced ~11,000 items (4 levels) — fresh build', () => {
    benchmarkResult.value = TreeViewItemsPlugin.buildItemsStateIfNeeded({
      items: balanced10k.items,
    });
  });

  bench('deep 10 levels, ~2,000 items — fresh build', () => {
    benchmarkResult.value = TreeViewItemsPlugin.buildItemsStateIfNeeded({ items: deep2k.items });
  });

  // Today a single changed item costs a full rebuild (`shouldRebuildItemsState` only compares
  // parameter identities, there is no incremental path for the `items` prop). Once items are
  // diffed incrementally, this bench is the one expected to drop by orders of magnitude while
  // the fresh-build benches above stay stable.
  bench('one changed item among 10,000 — currently a full rebuild', () => {
    benchmarkResult.value = TreeViewItemsPlugin.buildItemsStateIfNeeded({
      items: flat10kWithOneChange,
    });
  });
});
