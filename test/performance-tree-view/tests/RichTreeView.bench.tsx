import * as React from 'react';
import { benchmark } from '@mui/internal-benchmark';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { buildBalanced1K, buildFlat10K } from 'test/utils/tree-view/buildTreeViewItems';

const balanced1k = buildBalanced1K();
const flat10k = buildFlat10K();

benchmark('RichTreeView mount — 1,000 items expanded', () => (
  <RichTreeView items={balanced1k.items} defaultExpandedItems={balanced1k.defaultExpandedItems} />
));

benchmark(
  'RichTreeView mount — 10,000 flat items',
  () => <RichTreeView items={flat10k.items} />,
  // 10k mounted items make the default 20+10 iterations too slow.
  { runs: 10, warmupRuns: 3 },
);

benchmark('RichTreeView mount — 1,000 items, checkbox selection with propagation', () => (
  <RichTreeView
    items={balanced1k.items}
    defaultExpandedItems={balanced1k.defaultExpandedItems}
    checkboxSelection
    multiSelect
    selectionPropagation={{ parents: true, descendants: true }}
  />
));
