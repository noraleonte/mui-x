import * as React from 'react';
import { benchmark } from '@mui/internal-benchmark';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { buildBalanced1K } from 'test/utils/tree-view/buildTreeViewItems';
import { renderJsxTree } from '../utils';

const balanced1k = buildBalanced1K();

// Captures the JSX registration cost: one store write per mounting item plus the
// per-item DOM-scanning effects deriving children order.
benchmark(
  'SimpleTreeView mount — 1,000 JSX items expanded',
  () => (
    <SimpleTreeView defaultExpandedItems={balanced1k.defaultExpandedItems}>
      {renderJsxTree(balanced1k.items)}
    </SimpleTreeView>
  ),
  // The slowest mount of the suite; the default 20+10 iterations are too slow.
  { runs: 10, warmupRuns: 3 },
);
