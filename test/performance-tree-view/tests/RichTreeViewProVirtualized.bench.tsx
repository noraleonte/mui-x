import * as React from 'react';
import { benchmark } from '@mui/internal-benchmark';
import { RichTreeViewPro } from '@mui/x-tree-view-pro/RichTreeViewPro';
import { buildVirtualized100K } from 'test/utils/tree-view/buildTreeViewItems';
import { nextFrame } from '../utils';

const virtualized100k = buildVirtualized100K();

// Expand the first two levels only — same shape as the docs virtualization demo.
const defaultExpandedItems = virtualized100k.parentIds.filter(
  (id) => id.split('-').length <= 3, // 'item-x' and 'item-x-y'
);

function renderTree() {
  return (
    <div style={{ height: 600 }}>
      <RichTreeViewPro items={virtualized100k.items} defaultExpandedItems={defaultExpandedItems} />
    </div>
  );
}

// Virtualization is enabled by default in RichTreeViewPro.
benchmark('RichTreeViewPro virtualized mount — 110,000 items', renderTree);

benchmark(
  'virtualized scroll — 110,000 items',
  renderTree,
  async ({ resumeReactRecording }) => {
    const scroller = document.querySelector<HTMLElement>('[data-virtualized]')!;

    resumeReactRecording();
    for (let i = 1; i <= 10; i += 1) {
      scroller.scrollTop = i * 2000;
      // eslint-disable-next-line no-await-in-loop
      await nextFrame();
    }
  },
  { reactRecordingPaused: true },
);
